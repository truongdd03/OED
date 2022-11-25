/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import store from '../index';
import * as _ from 'lodash';
import { MeterData } from '../types/redux/meters';
import { ConversionArray } from '../types/conversionArray';
import { UnitData, UnitType } from '../types/redux/units';
import { GroupDefinition } from '../types/redux/groups';
import { DataType } from '../types/Datasources';
import { State } from '../types/redux/state';
import { SelectOption } from '../types/items';

/**
 * The intersect operation of two sets.
 * @param setA The first set.
 * @param setB The second set.
 * @returns The intersection of two sets.
 */
export function setIntersect(setA: Set<number>, setB: Set<number>): Set<number> {
	return new Set(Array.from(setA).filter(i => setB.has(i)));
}

/**
 * Takes a set of meter ids and returns the set of compatible unit ids.
 * @param meters The set of meter ids.
 * @returns
 */
export function unitsCompatibleWithMeters(meters: Set<number>): Set<number> {
	const state = store.getState();
	// The first meter processed is different since intersection with empty set is empty.
	let first = true;
	// Holds current set of compatible units.
	let compatibleUnits = new Set<number>();
	// Loops over all meters.
	meters.forEach(function (meterId: number) {
		// Gets the meter associated with the meterId.
		const meter = _.get(state.meters.byMeterID, meterId) as MeterData;
		let meterUnits = new Set<number>();
		// If meter had no unit then nothing compatible with it.
		// This probably won't happen but be safe. Note once you have one of these then
		// the final result must be empty set but don't check specially since don't expect.
		if (meter.unitId != -99) {
			// Set of compatible units with this meter.
			meterUnits = unitsCompatibleWithUnit(meter.unitId);
		}
		// meterUnits now has all compatible units.
		if (first) {
			// First meter so all its units are acceptable at this point.
			compatibleUnits = meterUnits;
			first = false;
		} else {
			// Do intersection of compatible units so far with ones for this meters.
			compatibleUnits = setIntersect(compatibleUnits, meterUnits);
		}
	});
	// Now have final compatible units for the provided set of meter
	return compatibleUnits;
}

/**
 * Returns a set of units ids that are compatible with a specific unit id.
 * @param unitId The unit id.
 * @returns
 */
export function unitsCompatibleWithUnit(unitId: number): Set<number> {
	// unitSet starts as an empty set.
	const unitSet = new Set<number>();
	// If unit was null in the database then -99. This means there is no unit
	// so nothing is compatible with it. Skip processing and return empty set at end.
	// Do same if pik is not yet available.
	if (unitId != -99 && ConversionArray.pikAvailable()) {
		// The Pik array.
		const pik = ConversionArray.pik;
		// Get the row index in Pik of this unit.
		const row = pRowFromUnit(unitId);
		// The compatible units are all columns with true for Pik where i = row.
		// Loops over all columns of Pik in row.
		for (let k = 0; k < pik[0].length; ++k) {
			if (pik[row][k]) {
				// unit at index k is compatible with meter unit so add to set.
				// Convert index in Pik to unit id.
				unitSet.add(unitFromPColumn(k));
			}
		}
	}
	return unitSet;
}

/**
 * Returns the row index in Pik for a meter unit.
 * @param unitId The unit id.
 * @returns
 */
export function pRowFromUnit(unitId: number): number {
	const state = store.getState();
	const unit = _.find(state.units.units, function (o: UnitData) {
		// Since this is the row index, type of unit must be meter.
		return o.id == unitId && o.typeOfUnit == UnitType.meter;
	}) as UnitData;
	return unit.unitIndex;
}

/**
 * Returns the unit id given the row in Pik.
 * @param row The row to find the associated unit.
 * @returns
 */
export function unitFromPRow(row: number): number {
	const state = store.getState();
	const unit = _.find(state.units.units, function (o: UnitData) {
		// Since the given unitIndex is a row index, the unit type must be meter.
		return o.unitIndex == row && o.typeOfUnit == UnitType.meter;
	}) as UnitData;
	return unit.id;
}

/**
 * Returns the unit id given the column in Pik.
 * @param column The column to find the associated unit.
 * @returns
 */
export function unitFromPColumn(column: number): number {
	const state = store.getState();
	const unit = _.find(state.units.units, function (o: UnitData) {
		// Since the given unitIndex is a column index, the unit type must be different from meter.
		return o.unitIndex == column && o.typeOfUnit != UnitType.meter;
	}) as UnitData;
	return unit.id;
}

/**
 * Returns the set of meters's ids associated with the groupId used.
 * @param groupId The groupId.
 * @returns the set of deep children of this group
 */
export function metersInGroup(groupId: number): Set<number> {
	const state = store.getState();
	// Gets the group associated with groupId.
	// The deep children are automatically fetched with group state so should exist.
	const group = _.get(state.groups.byGroupID, groupId) as GroupDefinition;
	// Create a set of the deep meters of this group and return it.
	return new Set(group.deepMeters);
}

/**
 * Get options for the meter menu on the group page.
 * @param gid The group's id.
 */
export function getMeterMenuOptionsForGroup(gid: number): SelectOption[] {
	const state = store.getState() as State;
	// Get the currentGroup's compatible units.
	const currentUnits = unitsCompatibleWithMeters(metersInGroup(gid))
	// Current group's default graphic unit (via Redux).
	const defaultGraphicUnit = state.groups.byGroupID[gid].defaultGraphicUnit;
	// Get all meters.
	// TODO: Why unit not null?
	const meters = Object.values(state.meters.byMeterID) as MeterData[];

	// Options for the meter menu.
	const options: SelectOption[] = [];

	meters.forEach((meter: MeterData) => {
		const option = {
			label: meter.identifier,
			value: meter.id,
			isDisabled: false,
		} as SelectOption;

		const compatibilityChangeCase = getCompatibilityChangeCase(currentUnits, meter.id, DataType.Meter, defaultGraphicUnit);
		if (compatibilityChangeCase === GroupCase.NoCompatibleUnits) {
			option.isDisabled = true;
		} else {
			// TODO: Handle font
		}

		options.push(option);
	});

	return options;
}

/**
 * Get options for the group menu on the group page.
 * @param gid The group's id.
 */
 export function getGroupMenuOptionsForGroup(gid: number): SelectOption[] {
	const state = store.getState() as State;
	// Get the currentGroup's compatible units.
	const currentUnits = unitsCompatibleWithMeters(metersInGroup(gid))
	// Current group's default graphic unit (via Redux).
	const defaultGraphicUnit = state.groups.byGroupID[gid].defaultGraphicUnit;
	// Get all groups.
	const groups = Object.values(state.groups.byGroupID) as GroupDefinition[];

	// Options for the group menu.
	const options: SelectOption[] = [];

	groups.forEach((group: GroupDefinition) => {
		const option = {
			label: group.name,
			value: group.id,
			isDisabled: false,
		} as SelectOption;

		const compatibilityChangeCase = getCompatibilityChangeCase(currentUnits, group.id, DataType.Meter, defaultGraphicUnit);
		if (compatibilityChangeCase === GroupCase.NoCompatibleUnits) {
			option.isDisabled = true;
		} else {
			// TODO: Handle font
		}

		options.push(option);
	});

	return options;
}

/**
 * The four cases that could happen when adding a group/meter to a group:
 * 	- NoChange: Adding this meter/group will not change the compatible units for the group. 
 *  - LostCompatibleUnits: The meter/group is compatible with the default graphic unit although some compatible units are lost.
 *  - LostDefaultGraphicUnits: The meter/group is not compatible with the default graphic unit but there exists some compatible untis.
 *  - NoCompatibleUnits: The meter/group will cause the compatible units for the group to be empty.
 */
export const enum GroupCase {
	NoChange = 'NO_CHANGE',
	LostCompatibleUnits = 'LOST_COMPATIBLE_UNITS',
	LostDefaultGraphicUnit = 'LOST_DEFAULT_GRAPHIC_UNIT',
	NoCompatibleUnits = 'NO_COMPATIBLE_UNITS'
}

/**
 * Return the case associated if we add the given meter/group to a group.
 * @param otherUnits The current compatible units of the group
 * @param id The meter/group's id to add to the group.
 * @param type Can be METER or GROUP.
 * @param defaultGraphicUnit The default graphic unit.
 */
export function getCompatibilityChangeCase(otherUnits: Set<number>, id: number, type: DataType, defaultGraphicUnit: number): GroupCase {
	// Determine the compatible units for meter or group represented by the id.
	const newUnits = getCompatibleUnits(id, type);
	// Returns the associated case.
	return groupCase(otherUnits, newUnits, defaultGraphicUnit);
}

/**
 * Given a meter or group's id, returns its compatible units.
 * @param id The meter or group's id.
 * @param type Can be Meter or Group.
 */
function getCompatibleUnits(id: number, type: DataType): Set<number> {
	if (type == DataType.Meter) {
		const state = store.getState();
		// Get the unit id of meter.
		const unitId = state.meters.byMeterID[id].unitId;
		// Returns all compatible units with this unit id.
		return unitsCompatibleWithUnit(unitId);
	} else {
		// Note we do this once for each time we check all groups so place to optimize if needed.
		// However, this is done with Redux state so it may be fine to just check each time and do that for now.
		return unitsCompatibleWithMeters(metersInGroup(id));
	}
}

/**
 * Returns the group case given current units and new units. See the enum GroupCase for the list of possible cases.
 * @param currentUnits The current compatible units set.
 * @param newUnits The new compatible units set.
 * @param defaultGraphicUnit The default graphic unit.
 */
function groupCase(currentUnits: Set<number>, newUnits: Set<number>, defaultGraphicUnit: number): GroupCase {
	// The compatible units of a set of meters or groups is the intersection of the compatible units for each
	// Thus, we can get the units that will go away with (- is set subtraction/difference):
	// lostUnit = currentUnit - ( currentUnit n newUnits)
	let intersection = setIntersect(currentUnits, newUnits);
	let lostUnits = new Set(Array.from(currentUnits).filter(x => !intersection.has(x)));

	if (lostUnits.size == 0) {
		return GroupCase.NoChange;
	} else if (lostUnits.size == currentUnits.size) {
		return GroupCase.NoCompatibleUnits;
	} else if (defaultGraphicUnit != -99 && lostUnits.has(defaultGraphicUnit)) {
		return GroupCase.LostDefaultGraphicUnit;
	} else {
		// if the default graphic unit is no unit then you can add any meter/group
		return GroupCase.LostCompatibleUnits;
	}
}
// TODO The code for somethingLikeFont is missing.

// TODO Who is doing the code for when the selected group/meter is changed?