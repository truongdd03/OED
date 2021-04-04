
// const a = math.unit(45, 'cm')             // Unit 450 mm
// const b = math.unit('0.1 kilogram')       // Unit 100 gram
// const c = math.unit('2 inch')             // Unit 2 inch
// const e = math.unit('101325 kg/(m s^2)')  // Unit 101325 kg / (m s^2)

// const d = c.to('cm')                      // Unit 5.08 cm
// b.toNumber('gram')                        // Number 100
// math.number(b, 'gram')                    // Number 100

// console.log(a.toNumber('in'));
// console.log(c.equals(a))                               // false
// c.equals(d)                               // true
// c.equalBase(a)                            // true
// c.equalBase(b)                            // false

// d.toString()                              // String "5.08 cm"

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

	describe('user defined units (ideally)', () => {
		describe('from existing units', () => {
			it('should support custom multiplicative units', () => {
				const BTU = 'BTU';
				const kWh = 'kWh';
				const megajoules = 'MJ'

				// In one hour...
				const configObject = {
					definition: '0.1 kWh'
				};
				const hWBulb = 'hundredWattBulb';
				const hundredWattBulb = math.createUnit(hWBulb, configObject);

				const threeMJ = math.unit(3, megajoules);
				const threeHWBulb = math.unit(3, hWBulb);
				const threeHWBulbINkWH = math.unit(0.3, kWh);

				expect(threeHWBulb.toNumber(megajoules)).to.equal(threeHWBulbINkWH.toNumber(megajoules));

				const threeMJInHWBulb = threeMJ.toNumber(kWh) / 0.1;
				expect(threeMJ.toNumber(hWBulb)).to.equal(threeMJInHWBulb);

				// console.log(threeMJ.toNumber(hWBulb));

				// console.log(threeHWBulb.toNumber(megajoules));
			});

			// it('should support custom linear units', () => {

			// });

		})
	});
});