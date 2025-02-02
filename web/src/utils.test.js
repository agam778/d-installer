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

import { partition } from "./utils";

describe("partition", () => {
  it("returns two groups of elements that do and do not satisfy provided filter", () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const [odd, even] = partition(numbers, number => number % 2);

    expect(odd).toEqual([1, 3, 5]);
    expect(even).toEqual([2, 4, 6]);
  });
});
