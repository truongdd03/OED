/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Qty = require('js-quantities');
const { describe, it } = require('mocha');
const { expect } = require('chai');

describe('js-quantities unit system', () => {
	describe('multiplicative unit conversions', () => {
		it('should be able to convert from meters to feet', () => {
			const thirteenMeters = new Qty('13 m');
			expect(thirteenMeters.to('ft').toPrec('0.0001 ft').scalar).to.be.closeTo(42.6509, 0.0001);
			expect(thirteenMeters.to('ft').to('m').scalar).to.be.closeTo(13, 0.01);
		});

		it('should be able to convert from feet to meters', () => {
			const thirteenFeet = new Qty('13 ft');
			expect(thirteenFeet.to('m').toPrec('mm').scalar).to.be.closeTo(3.9624, 0.01);
			expect(thirteenFeet.to('m').to('ft').scalar).to.be.closeTo(13, 0.01);
		});
	});

	describe('linear conversions', () => {
		it('should be able to convert from Celsius to Fahrenheit', () => {
			const fiveDegC = new Qty('5 tempC');
			expect(fiveDegC.to('tempF').scalar).to.be.closeTo(41, 0.01);
			expect(fiveDegC.to('tempF').to('tempC').scalar).to.be.closeTo(5, 0.01);
		});

		it('should be able to convert from Fahrenheit to Celsius', () => {
			const fortyOneDegF = new Qty('41 tempF');
			expect(fortyOneDegF.to('tempC').scalar).to.be.closeTo(5, 0.01);
			expect(fortyOneDegF.to('tempC').to('tempF').scalar).to.be.closeTo(41, 0.01);
		});
	});

});