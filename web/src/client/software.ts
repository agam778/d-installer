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

import { WithStatus, WithProgress } from "./mixins";
import { DBusClient, DBusChanges } from "./dbus";

const SOFTWARE_SERVICE = "org.opensuse.DInstaller.Software";
const SOFTWARE_IFACE = "org.opensuse.DInstaller.Software1";
const SOFTWARE_PATH = "/org/opensuse/DInstaller/Software1";

type Product = {
  id: string,
  name: string,
  description: string
}

/**
 * Software client
 */
class Client {
  client: DBusClient;

  constructor(dbusClient?: DBusClient) {
    this.client = dbusClient || new DBusClient(SOFTWARE_SERVICE);
  }

  /**
   * Return the list of available products
   */
  async getProducts(): Promise<Product[]> {
    const proxy = await this.client.proxy(SOFTWARE_IFACE);
    return proxy.AvailableBaseProducts.map((product: [string, string, object]) => {
      const [id, name, meta] = product;
      return { id, name, description: (meta as any).description?.v };
    });
  }

  /**
   * Return the selected product
   */
  async getSelectedProduct(): Promise<Product> {
    const products = await this.getProducts();
    const proxy = await this.client.proxy(SOFTWARE_IFACE);
    if (proxy.SelectedBaseProduct === "") {
      return null;
    }
    return products.find(product => product.id === proxy.SelectedBaseProduct);
  }

  /**
  * Selects the product with the given ID
  */
  async selectProduct(id: string) {
    const proxy = await this.client.proxy(SOFTWARE_IFACE);
    return proxy.SelectProduct(id);
  }

  /**
   * Register a callback to run when properties in the Software object change
   *
   * @param {function} handler - callback function
   */
  onProductChange(handler: (id: string) => void) {
    return this.client.onObjectChanged(SOFTWARE_PATH, SOFTWARE_IFACE, (changes: DBusChanges) => {
      if ("SelectedBaseProduct" in changes) {
        const selected = changes.SelectedBaseProduct.v as string;
        handler(selected);
      }
    });
  }
}

class SoftwareClient extends WithProgress(WithStatus(Client, SOFTWARE_PATH), SOFTWARE_PATH) {}
export { SoftwareClient };
