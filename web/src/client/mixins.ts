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

import cockpit from "../lib/cockpit";
import { DBusClient, ChangesFn } from "./dbus";

type GConstructor<T = {}> = new (...args: any[]) => T;
type WithDBusClient = GConstructor<{ client: DBusClient }>;

const STATUS_IFACE = "org.opensuse.DInstaller.ServiceStatus1";

function WithStatus<TBase extends WithDBusClient>(Base: TBase, object_path: string) {
  return class extends Base {
    /**
     * Returns the service status
     *
     * @return 0 for idle, 1 for busy
     */
    async getStatus(): Promise<number> {
      const proxy = await this.client.proxy(STATUS_IFACE, object_path);
      return (proxy as any).Current;
    }

    /**
     * Registers a callback to run when the "CurrentInstallationPhase" changes
     *
     * @param handler - callback function
     * @return function to disable the callback
     */
    onStatusChange(handler: (value: any) => void) {
      return this.client.onObjectChanged(object_path, STATUS_IFACE, (changes: object) => {
        if ("Current" in changes) {
          handler(((changes as any).Current as any).v);
        }
      });
    }
  };
}

const PROGRESS_IFACE = "org.opensuse.DInstaller.Progress1";

type Progress = {
  total: number,
  current: number,
  message: number,
  finished: number
}

function WithProgress<TBase extends WithDBusClient>(Base: TBase, object_path: string) {
  return class extends Base {
    /**
     * Returns the service progress
     *
     * @return an object containing the total steps,
     *   the current step and whether the service finished or not.
     */
    async getProgress(): Promise<Progress> {
      const proxy = await this.client.proxy(PROGRESS_IFACE, object_path);
      return {
        total: (proxy as any).TotalSteps,
        current: (proxy as any).CurrentStep[0],
        message: (proxy as any).CurrentStep[1],
        finished: (proxy as any).Finished
      };
    }

    /*
     * Register a callback to run when the progress changes
     *
     * @param {function} handler - callback function
     * @return {function} function to disable the callback
     */
    onProgressChange(handler: (value: Progress) => void) {
      return this.client.onObjectChanged(object_path, PROGRESS_IFACE, (changes: any) => {
        const { TotalSteps, CurrentStep, Finished } = changes;
        if (TotalSteps === undefined && CurrentStep === undefined && Finished === undefined) {
          return;
        }

        this.getProgress().then(handler);
      });
    }
  };
}

export { WithStatus, WithProgress };
