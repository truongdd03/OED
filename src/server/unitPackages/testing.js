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
		expect(thirteenCM.equals(thirteenCM.to('m'))).to.be.true; // true
		expect(thirteenCMInFeet.equals(thirteenCMInFeet.to('ft'))).to.be.true; // true

		expect(thirteenCM.equalBase(thirteenCMInFeet)).to.be.true;

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

		expect(inCelsius.equalBase(inFahrenheit)).to.be.true;

		expect(inCelsius.equals(inFahrenheit)).to.be.true;

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

		expect(math.add(threeBTU, kWhExample).toNumber(megajoules)).to.be.closeTo(threeBTU.toNumber(megajoules) + kWhExample.toNumber(megajoules), 0.00000001);
	});

	describe('chain conversion', () => {

		it('should pass the example with lightbulbs', () => {
			const hundredWattBulb = 'hundredWattBulb';
			const hundredWattBulbConfigObject = {
				definition: '0.1 kWh',
				baseName: 'object'
			};

			math.createUnit(hundredWattBulb, hundredWattBulbConfigObject);
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

				console.log(math.evaluate('123 kWhUnitPrice + 3 BTUUnitPrice').toNumber(EURO)); // 37.99984036463941
				console.log(math.evaluate('123 kWhUnitPrice').toNumber(USD)); // 13.53
				console.log(math.evaluate('3 BTUUnitPrice').toNumber(CAN)); // 39
				console.log(math.evaluate('123 kWhUnitPrice').toNumber(EURO)); // 11.505787496149642
				console.log(math.evaluate('3 BTUUnitPrice').toNumber(EURO)); // 26.494052868489764
		});
	});

});