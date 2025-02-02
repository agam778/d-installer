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

/*
 * Based in the previous work done for cockpit-wicked project, see
 *   - https://github.com/openSUSE/cockpit-wicked
 *   - https://github.com/openSUSE/cockpit-wicked/blob/master/src/components/AddressesDataList.js
 */

import React from "react";
import {
  Button,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  DataListAction,
  Stack,
  StackItem,
  Split,
  SplitItem
} from "@patternfly/react-core";

import FormLabel from "./FormLabel";
import IpAddressInput from "./IpAddressInput";
import IpPrefixInput from "./IpPrefixInput";

let index = 0;

export default function AddressesDataList({
  addresses: originalAddresses,
  updateAddresses,
  allowEmpty = true
}) {
  const addresses = originalAddresses.map(addr => {
    const newAddr = addr;
    if (!newAddr.id) newAddr.id = index++;
    return newAddr;
  });

  const addAddress = () => {
    addresses.push({ address: "", prefix: "", id: index++ });
    updateAddresses(addresses);
  };

  const updateAddress = (id, field, value) => {
    const address = addresses.find(addr => addr.id === id);
    address[field] = value;
    updateAddresses(addresses);
  };

  const deleteAddress = id => {
    const addressIdx = addresses.findIndex(addr => addr.id === id);
    addresses.splice(addressIdx, 1);
    updateAddresses(addresses);
  };

  const renderAddress = ({ id, address, prefix }) => {
    const renderDeleteAction = () => {
      if (!allowEmpty && addresses.length === 1) return null;

      return (
        <DataListAction>
          <Button isSmall variant="link" className="remove-link" onClick={() => deleteAddress(id)}>
            Remove
          </Button>
        </DataListAction>
      );
    };

    const cells = [
      <DataListCell key={`address-${id}-address`}>
        <IpAddressInput
          defaultValue={address}
          onChange={value => updateAddress(id, "address", value)}
          placeholder="IP Address"
          aria-label="IP Address"
        />
      </DataListCell>,
      <DataListCell key={`address-${id}-prefix`}>
        <IpPrefixInput
          defaultValue={prefix}
          onChange={value => updateAddress(id, "prefix", value)}
          placeholder="Prefix length or netmask"
          aria-label="Prefix length or netmask"
        />
      </DataListCell>
    ];

    return (
      <DataListItem key={`address-${id}`}>
        <DataListItemRow>
          <DataListItemCells dataListCells={cells} />
          {renderDeleteAction()}
        </DataListItemRow>
      </DataListItem>
    );
  };

  const newAddressButtonText = addresses.length ? "Add another address" : "Add an address";

  return (
    <Stack className="data-list-form" hasGutter>
      <StackItem>
        <Split hasGutter>
          <SplitItem isFilled>
            <FormLabel isRequired={!allowEmpty}>Addresses</FormLabel>
          </SplitItem>
          <SplitItem>
            <Button isSmall variant="primary" className="btn-sm" onClick={() => addAddress()}>
              {newAddressButtonText}
            </Button>
          </SplitItem>
        </Split>
      </StackItem>
      <StackItem>
        <DataList isCompact gridBreakpoint="none" title="Addresses data list">
          {addresses.map(address => renderAddress(address))}
        </DataList>
      </StackItem>
    </Stack>
  );
}
