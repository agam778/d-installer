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
import { Form, FormGroup, Text, TextInput } from "@patternfly/react-core";
import Popup from "./Popup";
import ConnectionsDataList from "./ConnectionsDataList";

import { CONNECTION_STATE } from "./client/network";

export default function NetworkWiredStatus({ connections }) {
  const conns = connections.filter(c => c.state === CONNECTION_STATE.ACTIVATED);
  const [editting, setEditing] = useState(null);

  return (
    <>
      <Text>{conns.length ? "Wired connected:" : "Wired not connected"}</Text>

      <ConnectionsDataList conns={conns} onModify={setEditing} />

      <Popup isOpen={editting} title={`Edit "${editting?.id}" connection`}>
        {/* FIXME: use a real onSubmit callback */}
        <Form id="edit-connection" onSubmit={() => setEditing(null)}>
          <FormGroup fieldId="id" label="Connectoin ID">
            <TextInput
              id="id"
              name="connectionId"
              aria-label="Connection ID"
              value={editting?.id}
              label="Connection ID"
            />
          </FormGroup>

          {/* FIXME: allow editing more than one IP */}
          <FormGroup fieldId="ip" label="IP">
            <TextInput
              id="ip"
              name="connectionIp"
              aria-label="IP"
              value={editting?.addresses[0]?.address}
              label="IP"
            />
          </FormGroup>
        </Form>

        <Popup.Actions>
          <Popup.Confirm form="edit-connection" type="submit" />
          {/* FIXME: use a real onClick callback */}
          <Popup.Cancel onClick={() => setEditing(null)} />
        </Popup.Actions>
      </Popup>
    </>
  );
}
