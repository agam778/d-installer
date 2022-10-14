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

import React, { useState } from "react";
import { Form, FormGroup, FormSelect, FormSelectOption, TextInput } from "@patternfly/react-core";
import { useInstallerClient } from "./context/installer";
import AddressesDataList from "./AddressesDataList";
import Popup from "./Popup";

export default function IpSettingsForm({ connection, onClose }) {
  const client = useInstallerClient();
  const { ipv4 = {} } = connection;
  const [name, setName] = useState(connection.id);
  const [addresses, setAddresses] = useState(connection.addresses || []);
  const [method, setMethod] = useState(ipv4.method?.v || "auto");
  const [gateway, setGateway] = useState(ipv4.gateway?.v || "");

  const changeMethod = (value) => {
    let nextAddresses = addresses.filter(addr => addr.address !== "");

    if (value === "manual" && nextAddresses.length === 0) {
      // FIXME: Use a model instead?
      nextAddresses = [{ address: "", prefix: "" }];
    }

    setAddresses(nextAddresses);
    setMethod(value);
  };

  const onSubmit = e => {
    e.preventDefault();

    const updatedConnection = {
      ...connection,
      id: name,
      addresses,
      method,
      gateway
    };

    console.log(updatedConnection);
    client.network.updateConnection(updatedConnection);
    onClose();
  };

  return (
    <Popup isOpen height="medium" title={`Edit "${connection.id}" connection`}>
      {/* FIXME: use a real onSubmit callback */}
      <Form id="edit-connection" onSubmit={onSubmit}>
        <FormGroup fieldId="id" label="Name">
          <TextInput
            id="id"
            name="id"
            aria-label="Name"
            value={name}
            label="Name"
            onChange={setName}
          />
        </FormGroup>

        <FormGroup fieldId="id" label="Mode">
          <FormSelect
            id="method"
            name="method"
            aria-label="Mode"
            value={method}
            label="Mode"
            onChange={changeMethod}
          >
            <FormSelectOption key="auto" value="auto" label="Automatic (DHCP)" />
            <FormSelectOption key="manual" value="manual" label="Manual" />
          </FormSelect>
        </FormGroup>

        <FormGroup fieldId="gateway" label="Gateway">
          <TextInput
            id="gateway"
            name="gateway"
            aria-label="Gateway"
            value={gateway}
            label="Gateway"
            onChange={setGateway}
          />
        </FormGroup>

        <AddressesDataList
          addresses={addresses}
          updateAddresses={setAddresses}
          allowEmpty={method === "auto"}
        />
      </Form>

      <Popup.Actions>
        <Popup.Confirm form="edit-connection" type="submit" />
        {/* FIXME: use a real onClick callback */}
        <Popup.Cancel onClick={onClose} />
      </Popup.Actions>
    </Popup>
  );
}
