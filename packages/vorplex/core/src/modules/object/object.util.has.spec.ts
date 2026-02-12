import { $Object } from './object.util';

describe($Object.hasKeys.name, () => {
    it('should return true if the object contains the properties', () => {
        expect($Object.hasKeys({ name: '', age: 0 }, 'name', 'age')).toBeTruthy();
    });

    it('should return false if the object does not contain all the properties', () => {
        expect($Object.hasKeys({ name: '' }, 'name', 'age')).toBeFalsy();
    });
});
