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
import { HelperText, HelperTextItem, Form, FormGroup, FormSelect, FormSelectOption, TextInput } from "@patternfly/react-core";
import { useInstallerClient } from "./context/installer";
import AddressesDataList from "./AddressesDataList";
import Popup from "./Popup";

const METHODS = {
  MANUAL: "manual",
  AUTO: "auto"
};

export default function IpSettingsForm({ connection, onClose }) {
  const client = useInstallerClient();
  const { ipv4: ipv4Settings = {} } = connection;
  const [name, setName] = useState(connection.id);
  const [addresses, setAddresses] = useState(ipv4Settings.addresses || []);
  const [method, setMethod] = useState(ipv4Settings.method || "auto");
  const [gateway, setGateway] = useState(ipv4Settings.gateway || "");
  const [errors, setErrors] = useState({});

  const isSetAsInvalid = field => Object.keys(errors).includes(field);

  const validatedAttrValue = (field) => {
    if (isSetAsInvalid(field)) return "error";

    return "default";
  }
  const cleanAddresses = (addrs) => addrs.filter(addr => addr.address !== "");

  const cleanError = (field) => {
    if (isSetAsInvalid(field)) {

      const { [field]: _, ...nextErrors } = errors;
      setErrors(nextErrors);
    }
  };

  const changeName = (value) => {
    cleanError("name");
    setName(value);
  };

  const changeMethod = (value) => {
    let nextAddresses = cleanAddresses(addresses);

    if (value === "manual" && nextAddresses.length === 0) {
      // FIXME: Use a model instead?
      nextAddresses = [{ address: "", prefix: "" }];
    }

    cleanError("method");
    setAddresses(nextAddresses);
    setMethod(value);
  };

  const validate = (sanitizedAddresses) => {
    setErrors({});

    const nextErrors = {};

    if (name === "") {
      nextErrors.name = "The connection must have a name";
    }

    if (method === METHODS.MANUAL && sanitizedAddresses.length === 0) {
      nextErrors.method = "At least one address must be provided for selected mode";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  const onSubmit = e => {
    e.preventDefault();

    const sanitizedAddresses = cleanAddresses(addresses);

    if (!validate(sanitizedAddresses)) return;

    const updatedConnection = {
      ...connection,
      id: name,
      addresses: sanitizedAddresses,
      method,
      gateway
    };

    console.log(updatedConnection);
    //client.network.updateConnection(updatedConnection);
    onClose();
  };

  const renderError = (field) => {
    if (!isSetAsInvalid(field)) return null;

    return (
      <HelperText>
        <HelperTextItem variant="error">{errors[field]}</HelperTextItem>
      </HelperText>
    );
  }

  return (
    <Popup isOpen height="medium" title={`Edit "${connection.id}" connection`}>
      {/* FIXME: use a real onSubmit callback */}
      <Form id="edit-connection" onSubmit={onSubmit}>
        <FormGroup fieldId="id" label="Name">
          <TextInput
            id="name"
            name="name"
            aria-label="Name"
            value={name}
            label="Name"
            onChange={changeName}
            validated={validatedAttrValue("name")}
          />
          {renderError("name")}
        </FormGroup>

        <FormGroup fieldId="id" label="Mode">
          <FormSelect
            id="method"
            name="method"
            aria-label="Mode"
            value={method}
            label="Mode"
            onChange={changeMethod}
            validated={validatedAttrValue("method")}
          >
            <FormSelectOption key="auto" value="auto" label="Automatic (DHCP)" />
            <FormSelectOption key="manual" value="manual" label="Manual" />
          </FormSelect>
          {renderError("method")}
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
