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
import { DBusClient } from "./dbus";
import { WithStatus } from "./mixins";

const STORAGE_SERVICE = "org.opensuse.DInstaller.Storage";
const STORAGE_PROPOSAL_IFACE = "org.opensuse.DInstaller.Storage.Proposal1";
const STORAGE_PROPOSAL_PATH = "/org/opensuse/DInstaller/Storage/Proposal1";

type StorageAction = {
  text: string,
  subvol: boolean,
  delete: boolean
}

type StorageProposal = {
  availableDevices: StorageDevice[],
  candidateDevices: string[],
  lvm: boolean
}

type StorageDevice = {
  id: string,
  label: string
}

/**
 * Storage client
 */
class StorageClient {
  client: DBusClient;

  constructor(dbusClient?: DBusClient) {
    this.client = dbusClient || new DBusClient(STORAGE_SERVICE);
  }

  /**
   * Return the actions for the current proposal
   */
  async getStorageActions(): Promise<StorageAction[]> {
    const proxy = await this.client.proxy(STORAGE_PROPOSAL_IFACE);
    return proxy.Actions.map((action: any) => {
      const { Text: { v: textVar }, Subvol: { v: subvolVar }, Delete: { v: deleteVar } } = action;
      return { text: textVar, subvol: subvolVar, delete: deleteVar };
    });
  }

  /**
   * Return storage proposal settings
   */
  async getStorageProposal(): Promise<StorageProposal> {
    const proxy = await this.client.proxy(STORAGE_PROPOSAL_IFACE);
    return {
      availableDevices: proxy.AvailableDevices.map(([id, label]) => {
        return { id, label };
      }),
      candidateDevices: proxy.CandidateDevices,
      lvm: proxy.LVM
    };
  }

  async calculateStorageProposal({ candidateDevices }) {
    const proxy = await this.client.proxy(STORAGE_PROPOSAL_IFACE);
    return proxy.Calculate({
      CandidateDevices: cockpit.variant("as", candidateDevices)
    });
  }

  /**
   * Register a callback to run when properties in the Actions object change
   *
   * @param handler - callback function
   */
  onActionsChange(handler: ((actions: StorageAction[]) => void)) {
    return this.client.onObjectChanged(STORAGE_PROPOSAL_PATH, STORAGE_PROPOSAL_IFACE, (changes: any) => {
      const { Actions: actions } = changes;
      if (actions !== undefined) {
        const newActions = actions.v.map((action: any) => {
          const { Text: textVar, Subvol: subvolVar, Delete: deleteVar } = action;
          return { text: textVar.v, subvol: subvolVar.v, delete: deleteVar.v };
        });
        handler(newActions);
      }
    });
  }

  /**
   * Register a callback to run when properties in the Storage Proposal object change
   *
   * @param handler - callback function
   */
  onStorageProposalChange(handler: ((selected: boolean) => void)) {
    return this.client.onObjectChanged(STORAGE_PROPOSAL_PATH, STORAGE_PROPOSAL_IFACE, changes => {
      const [selected] = (changes.CandidateDevices as any).v;
      handler(selected);
    });
  }
}

export default WithStatus(StorageClient, STORAGE_PROPOSAL_PATH);
