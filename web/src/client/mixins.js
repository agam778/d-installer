/*
 * Copyright (c) [2022] SUSE LLC
 *
 * All Rights Reserved.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of version 2 of the GNU General Public License as published
 * by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, contact SUSE LLC.
 *
 * To contact SUSE LLC about this file by physical or electronic mail, you may
 * find current contact information at www.suse.com.
 */

const withDBus = {
  /**
   * Registers a proxy for given iface
   *
   * @param {string} iface - D-Bus iface
   * @param {string} path - D-Bus object path
   * @return {Object} a cockpit DBusProxy
   */
  async proxy(iface, path) {
    const proxy = this._client.proxy(iface, path, { watch: true });
    await proxy.wait();

    return proxy;
  },

  /**
   * Register a callback to run when properties change for given D-Bus path
   *
   * @param {string} path - D-Bus path
   * @param {string} iface - D-Bus interface name
   * @param {function} handler - callback function
   * @return {function} function to unsubscribe
   */
  onObjectChanged(path, iface, handler) {
    console.log("Susbcribing to changes on", path, iface);
    const { remove } = this._client.subscribe(
      {
        path,
        interface: "org.freedesktop.DBus.Properties",
        member: "PropertiesChanged"
      },
      (_path, _iface, _signal, args) => {
        const [source_iface, changes, invalid] = args;
        if (iface === source_iface) {
          handler(changes, invalid);
        }
      }
    );
    return remove;
  },

  /**
   * Register a callback to run when some D-Bus signal is emitted
   *
   * @param {function} handler - callback function
   * @return {function} function to unsubscribe
   */
  onSignal(match, handler) {
    const { remove } = this._client.subscribe(match, handler);
    return remove;
  }
};

const STATUS_IFACE = "org.opensuse.DInstaller.ServiceStatus1";

const withStatus = object_path => {
  return {
    /**
     * Returns the service status
     *
     * @return {Promise.<number>} 0 for idle, 1 for busy
     */
    async getStatus() {
      const proxy = await this.proxy(STATUS_IFACE, object_path);
      return proxy.Current;
    },

    /**
     * Register a callback to run when the "CurrentInstallationPhase" changes
     *
     * @param {function} handler - callback function
     * @return {function} function to disable the callback
     */
    onStatusChange(handler) {
      return this.onObjectChanged(object_path, STATUS_IFACE, changes => {
        if ("Current" in changes) {
          handler(changes.Current.v);
        }
      });
    }
  };
};

const PROGRESS_IFACE = "org.opensuse.DInstaller.Progress1";

const withProgress = object_path => {
  return {
    /**
     * Returns the service progress
     *
     * @return {Promise.<object>} an object containing the total steps,
     *   the current step and whether the service finished or not.
     */
    async getProgress() {
      const proxy = await this.proxy(PROGRESS_IFACE, object_path);
      return {
        total: proxy.TotalSteps,
        current: proxy.CurrentStep[0],
        message: proxy.CurrentStep[1],
        finished: proxy.Finished
      };
    },

    /**
     * Register a callback to run when the progress changes
     *
     * @param {function} handler - callback function
     * @return {function} function to disable the callback
     */
    onProgressChange(handler) {
      return this.onObjectChanged(object_path, PROGRESS_IFACE, changes => {
        const { TotalSteps, CurrentStep, Finished } = changes;
        if (TotalSteps === undefined && CurrentStep === undefined && Finished === undefined) {
          return;
        }

        this.getProgress().then(handler);
      });
    }
  };
};

/**
 * Utility method for applying mixins to given object
 *
 * @param {Object} klass - target object
 * @param {...function} fn - function(s) to be copied to given object prototype
 */
const applyMixin = (klass, ...fn) => Object.assign(klass.prototype, ...fn);

export { applyMixin, withDBus, withStatus, withProgress };
