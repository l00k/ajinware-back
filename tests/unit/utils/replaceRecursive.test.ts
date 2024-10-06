import { replaceRecursive } from '$/utils/replaceRecursive.js';

describe('replaceRecursive', () => {
    it('Should properly replace arrays', () => {
        const object : any = { a: [ 1, 2 ], b: 2, d: 6 };
        const other : any = { a: [ 3 ], b: [ 4 ], c: 5 };
        
        replaceRecursive(object, other);
        expect(object).to.deep.eq({
            a: [ 3, 2 ],
            b: [ 4 ],
            c: 5,
            d: 6,
        });
    });
});
