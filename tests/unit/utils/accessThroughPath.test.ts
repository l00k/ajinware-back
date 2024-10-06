import { accessThroughPath } from '$/utils/accessThroughPath.js';

describe('accessThroughPath', () => {
    let author;
    
    beforeEach(() => {
        author = {
            name: 'J.K. Rowling',
            meta: {
                sex: 'Female'
            },
            books: [
                { name: 'Harry Potter' }
            ]
        };
    });
    
    it('Should access properties through path', async() => {
        expect(
            accessThroughPath(author, 'name')
        ).to.be.eq('J.K. Rowling');
    });
    
    it('Should access properties through path (through sub objects)', async() => {
        expect(
            accessThroughPath(author, 'meta.sex')
        ).to.be.eq('Female');
    });
    
    it('Should access properties through path (through arrays)', async() => {
        expect(
            accessThroughPath(author, 'books.0.name')
        ).to.be.eq('Harry Potter');
    });
    
    it('Should throw on undefined property', async() => {
        expect(
            () => accessThroughPath(author, 'books.1.name', { throwOnFailure: true })
        ).to.throw();
    });
    
    describe('with autocreate', () => {
        it('Should autocreate properties', async() => {
            expect(
                accessThroughPath(author, 'books.1.name', { autoCreate: true })
            ).to.be.eq(undefined);
            
            expect(
                accessThroughPath(author, 'books.1')
            ).to.be.eql({});
        });
    });
    
    describe('without throw', () => {
        it('Should return undefined', async() => {
            expect(
                accessThroughPath(author, 'books.1.name', { throwOnFailure: false })
            ).to.be.eq(undefined);
        });
    });
});
