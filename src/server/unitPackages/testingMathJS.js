/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { describe, it } = require('mocha');
const { expect } = require('chai');
const math = require('mathjs');

describe('mathjs unit system', () => {
	it('should be able to do basic multiplicative unit conversions', () => {
		// Base: Length
		const thirteenCM = math.unit(13, 'cm');
		const thirteenCMInFeet = math.unit(0.426509, 'ft'); // manual conversion

		// Explicit test
		expect(thirteenCM.toNumber('ft')).to.be.closeTo(thirteenCMInFeet.toNumber(), 0.0001);
		expect(thirteenCMInFeet.toNumber('cm')).to.be.closeTo(thirteenCM.toNumber(), 0.0001);

		// These failed because of rounding issues.
		// expect(thirteenCM.toNumber('ft')).to.be.equal(thirteenCMInFeet.toNumber());
		// expect(thirteenCMInFeet.toNumber('cm')).to.be.equal(thirteenCM.toNumber());

		// library test
		expect(thirteenCM.equals(thirteenCM.to('m'))).to.equal(true); // true
		expect(thirteenCMInFeet.equals(thirteenCMInFeet.to('ft'))).to.equal(true); // true

		expect(thirteenCM.equalBase(thirteenCMInFeet)).to.equal(true);

		// These unexpectedly failed. They failed because of rounding issues.
		// expect(thirteenCM.equals(thirteenCMInFeet)).to.be.true;
		// expect(thirteenCMInFeet.equals(thirteenCMInFeet)).to.be.true;


		// Base: Energy
		const BTU = 'BTU';
		const kWh = 'kWh';
		const megajoules = 'MJ'

		const threeBTU = math.unit(3, BTU);
		const BTUToMJ = 0.001055;
		const threeBTUInMJ = threeBTU.toNumber() * BTUToMJ;
		const inMJUnit = math.unit(threeBTUInMJ, megajoules);

		expect(threeBTU.toNumber(megajoules)).to.be.closeTo(inMJUnit.toNumber(), 0.0001);
		// expect(threeBTU.toNumber(megajoules)).to.equal(inMJUnit.toNumber()); fails due to imprecise manual conversion factor

		const kWhExample = math.unit(123, kWh);
		const kWhToMJ = 3.6;
		const kWhExampleInMJ = math.unit(kWhExample.toNumber() * kWhToMJ, megajoules);
		expect(kWhExample.toNumber(megajoules)).to.equal(kWhExampleInMJ.toNumber());
		expect(kWhExampleInMJ.toNumber(kWh)).to.equal(kWhExample.toNumber());
	});

	it('should be able to perform linear conversions', () => {
		const CelsiusUnit = 'degC';
		const FahrenheitUnit = 'degF';

		const inCelsius = math.unit(5, CelsiusUnit);
		const inFahrenheit = math.unit(41, FahrenheitUnit);

		expect(inCelsius.equalBase(inFahrenheit)).to.equal(true);

		expect(inCelsius.equals(inFahrenheit)).to.equal(true);

		// Compare raw values; we use closeTo rather than equals because equals would fail due to rounding errors.
		expect(inCelsius.to(FahrenheitUnit).toNumber()).to.be.closeTo(inFahrenheit.toNumber(), 0.0001);
		expect(inFahrenheit.to(CelsiusUnit).toNumber()).to.be.closeTo(inCelsius.toNumber(), 0.0001);
	});

	it('should be able to perform arithmetic using different units', () => {
		// Base: Energy
		const BTU = 'BTU';
		const kWh = 'kWh';
		const megajoules = 'MJ'

		const threeBTU = math.unit(3, BTU);
		// const BTUToMJ = 0.001055;
		// const threeBTUInMJ = threeBTU.toNumber() * BTUToMJ;
		// const inMJUnit = math.unit(threeBTUInMJ, megajoules);

		const kWhExample = math.unit(123, kWh);
		// const kWhToMJ = 3.6;
		// const kWhExampleInMJ = math.unit(kWhExample.toNumber() * kWhToMJ, megajoules);

		expect(math.add(threeBTU, kWhExample).toNumber(megajoules)).to.be
			.closeTo(threeBTU.toNumber(megajoules) + kWhExample.toNumber(megajoules), 0.00000001);
	});

	describe('chain conversion', () => {

		it('should pass the example with lightbulbs', () => {
			const hundredWattBulb = 'hundredWattBulb';
			const hundredWattBulbConfigObject = {
				definition: '0.1 kWh',
				baseName: 'object'
			};

			math.createUnit(hundredWattBulb,
				hundredWattBulbConfigObject,
				{
					override: true // We override due to defining this unit in other places in the code.
				}
			);
			expect(math.evaluate('3000 BTU').toNumber(hundredWattBulb)).to.be.closeTo(9, 1);
		});

		describe('example with currency', () => {
			const USD = 'USD';
			const USDConfigObject = {
				baseName: 'currency'
			};

			const EURO = 'EURO';
			const EUROConfigObject = {
				definition: `1.17592994 ${USD}`,
				baseName: 'currency'
			};

			const CAN = 'CAN';
			const CANConfigObject = {
				definition: `0.79885 ${USD}`,
				baseName: 'currency'
			};

			math.createUnit(USD, USDConfigObject); // our unit that all other units will be defined on
			math.createUnit(EURO, EUROConfigObject);
			math.createUnit(CAN, CANConfigObject);

			// I think we need to separate the scientific units themselves from their relation to other units...
			const BTUUnitPRice = 'BTUUnitPrice';
			const BTUUnitPRiceConfig = {
				definition: `13 ${CAN}`,
				baseName: 'unitPrice'
			};

			const kWhUnitPrice = 'kWhUnitPrice';
			const kWhUnitPriceConfig = {
				definition: `0.11 ${USD}`,
				baseName: 'unitPrice'
			};

			math.createUnit(BTUUnitPRice, BTUUnitPRiceConfig);
			math.createUnit(kWhUnitPrice, kWhUnitPriceConfig);

			expect(math.evaluate('123 kWhUnitPrice + 3 BTUUnitPrice').toNumber(EURO)).to.be.closeTo(38, 0.1); // 37.99984036463941
			expect(math.evaluate('123 kWhUnitPrice').toNumber(USD)).to.be.closeTo(13.53, 0.1); // 13.53
			expect(math.evaluate('3 BTUUnitPrice').toNumber(CAN)).to.equal(39); // 39
			expect(math.evaluate('123 kWhUnitPrice').toNumber(EURO)).to.be.closeTo(11.51, 0.1); // 11.505787496149642
			expect(math.evaluate('3 BTUUnitPrice').toNumber(EURO)).to.be.closeTo(26.49, 0.1); // 26.494052868489764
			// NOTE: math#evaluate may be a security concern because it can parse certain methods such that the createUnit method.
			// For example, the following evaluation would create the knot unit:
			// math.evaluate('45 mile/hour to createUnit("knot", "0.514444m/s")') // 39.103964668651976 knot

		});
	});

	it('should ideally be able to link different dimensions', () => {
		// In the previous two examples of lightbulbs and currency we attempted to link
		// non-SI units (i.e. lightbulbs and currency) to SI units. For the simple lightbulb
		// case, we could define one hundred watt bulb in terms of kWh. However, in the currency
		// example, we have to define the price of kWh and BTU separate from the actual SI units.
		// This is because of inconsistencies of pricing. We said that 1 BTU costs 13 CAN$ and 
		// 1 kWh costs 0.11 USD. The existing relationship between BTUs to kWh is that 1 kWh = 3412.14 BTU (googled it).
		// This results in an inconsistency as multiplying both sides of 1 BTU = 13 CAN by the conversion factor from kWh to BTU
		// results in 1 kWh = 44357.82 CAN = 35435.244507 USD which would be an internal contradiction. 
		// Because of this problem we had to define the prices of the energy units independent of the SI themselves (aside from sharing the similar names).
		// It is still however important to be able to link the prices of energy units back to the the energy units themselves. 
		// For example, how much would a hundred watt lightbulb cost to run for an hour in EURO? 
		// This means that OED may have to build off of mathjs Unit system to interface user-defined units with existing SI units.
		// The following example is an attempt to do that by relying on strict naming conventions of the user-defined units.

		// Initialize units as constants
		const hundredWattBulb = 'hundredWattBulb';
		const hundredWattBulbConfigObject = {
			definition: '0.1 kWh',
			baseName: 'object'
		};

		const USD = 'USD';
		const USDConfigObject = {}; // empty because USD will serve as a base unit for other units.

		const EURO = 'EURO';
		const EUROConfigObject = {
			definition: `1.17592994 ${USD}`
		};

		const CAN = 'CAN';
		const CANConfigObject = {
			definition: `0.79885 ${USD}`
		};

		const BTUUnitPRice = 'BTUUnitPrice';
		const BTUUnitPRiceConfig = {
			definition: `13 ${CAN}`,
			baseName: 'unitPrice'
		};

		const kWhUnitPrice = 'kWhUnitPrice';
		const kWhUnitPriceConfig = {
			definition: `0.11 ${USD}`,
			baseName: 'unitPrice'
		};
		math.createUnit({
			[hundredWattBulb]: hundredWattBulbConfigObject
		},
			{
				override: true // We override because this unit was defined in a previous test case.
			}
		);

		math.createUnit({
			[USD]: USDConfigObject,
			[EURO]: EUROConfigObject,
			[CAN]: CANConfigObject
		},
			{
				baseName: 'currency',
				override: true // We override because this unit was defined in a previous test case.
			}
		);

		math.createUnit({
			[BTUUnitPRice]: BTUUnitPRiceConfig,
			[kWhUnitPrice]: kWhUnitPriceConfig
		},
			{
				baseName: 'unitPrice',
				override: true // We override because this unit was defined in a previous test case.
			}
		);

		/**
		 * 
		 * @param {string} energy A string representation of an unit of energy or defined on energy units, i.e. '1 BTU' or '1 hundredWattBulb'
		 * @param {string} unit The energy unit whose price we will measure 
		 * @param {string} currency The currency of the cost
		 * @returns An math.unit object of the price of the provided amount of energy in the specified unit.
		 */
		function priceOfEnergy(energy, unit, currency) {
			const unitPrice = unit + 'UnitPrice';
			const amountOfUnit = math.unit(energy).toNumber(unit);
			return math.evaluate(`${amountOfUnit} ${unitPrice}`).toNumber(currency);
		}

		expect(priceOfEnergy('1 BTU', 'BTU', 'CAN')).to.equal(13);
		expect(priceOfEnergy('1 BTU', 'kWh', 'USD')).to.be.closeTo(0.000293071 * 0.11, 0.0001); // 1 BTU = 0.000293071 kWh

		// 1 lightbulb = 0.1 kWh; 0.1 kWh = 341.214 BTU; 341.214 BTU = 4435.782 CAN; 4435.782 CAN = 3543.5244507 USD
		expect(priceOfEnergy('1 hundredWattBulb', 'BTU', 'USD')).to.be.closeTo(3543.5244507, 0.01);
		expect(priceOfEnergy('1 hundredWattBulb', 'kWh', 'USD')).to.be.closeTo(0.1 * 0.11, 0.0001);
	});
});