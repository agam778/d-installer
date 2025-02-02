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

import {
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
} from "@patternfly/react-core";

import Popup from './Popup';

export default function TargetSelector({ target, targets, onAccept }) {
  const [value, setValue] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const open = () => {
    setIsFormOpen(true);
    setValue(target);
  };

  const accept = (e) => {
    e.preventDefault();
    // TODO: handle errors
    onAccept(value);
    setIsFormOpen(false);
  };

  const cancel = () => setIsFormOpen(false);

  const buildSelector = () => {
    const selectorOptions = targets.map(target => {
      return <FormSelectOption key={target.id} value={target.id} label={target.label} />;
    });

    return (
      <FormSelect id="target" value={value} onChange={setValue} aria-label="target">
        {selectorOptions}
      </FormSelect>
    );
  };

  const targetDevice = targets.find(i => i.id === target);

  return (
    <>
      <Button variant="link" onClick={open}>
        {targetDevice && targetDevice.label}
      </Button>

      <Popup isOpen={isFormOpen} onSubmit={accept} aria-label="Target Selector">
        <Form id="target-selector">
          <FormGroup fieldId="target" label="Device to install into">
            {buildSelector()}
          </FormGroup>
        </Form>

        <Popup.Actions>
          <Popup.Confirm form="target-selector" type="submit" />
          <Popup.Cancel onClick={cancel} />
        </Popup.Actions>
      </Popup>
    </>
  );
}
