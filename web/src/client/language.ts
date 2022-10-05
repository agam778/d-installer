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

import { DBusClient, ChangesFn, DBusChanges } from "./dbus";

const LANGUAGE_SERVICE = "org.opensuse.DInstaller.Language";
const LANGUAGE_IFACE = "org.opensuse.DInstaller.Language1";
const LANGUAGE_PATH = "/org/opensuse/DInstaller/Language1";

type Language = {
  id: string,
  name: string
}

type LangID = string;

/**
 * Language client
 */
class LanguageClient {
  client: DBusClient;

  constructor(dbusClient?: DBusClient) {
    this.client = dbusClient || new DBusClient(LANGUAGE_SERVICE);
  }

  /**
   * Return the list of available languages
   */
  async getLanguages(): Promise<Language> {
    const proxy = await this.client.proxy(LANGUAGE_IFACE);
    return proxy.AvailableLanguages.map((lang: string[]) => {
      const [id, name] = lang;
      return { id, name };
    });
  }

  /**
   * Return the languages selected for installation
   */
  async getSelectedLanguages(): Promise<LangID[]> {
    const proxy = await this.client.proxy(LANGUAGE_IFACE);
    return proxy.MarkedForInstall;
  }

  /**
   * Set the languages to install
   *
   * @param langIDs - Identifier of languages to install
   */
  async setLanguages(langIDs: LangID[]): Promise<void> {
    const proxy = await this.client.proxy(LANGUAGE_IFACE);
    return proxy.ToInstall(langIDs);
  }

  /**
   * Register a callback to run when properties in the Language object change
   *
   * @param {function} handler - callback function
   */
  onLanguageChange(handler: ChangesFn) {
    return this.client.onObjectChanged(LANGUAGE_PATH, LANGUAGE_IFACE, (changes: DBusChanges) => {
      const selected = changes.MarkedForInstall.v[0];
      handler({ current: selected });
    });
  }
}

export {
  LanguageClient,
  type Language,
  type LangID
};
