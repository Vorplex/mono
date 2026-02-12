import { parseUrl } from './parse-url.function';

describe(parseUrl.name, () => {
    it('should parse a simple url', () => {
        const uri = 'http://localhost:5000';
        const url = parseUrl(uri);
        expect(url.href).toEqual(uri);
        expect(url.domain).toEqual('http://localhost:5000');
        expect(url.protocol).toEqual('http');
        expect(url.host).toEqual('localhost:5000');
        expect(url.hostname).toEqual('localhost');
        expect(url.port).toEqual(5000);
        expect(url.path).toEqual('');
        expect(url.search).toEqual('');
        expect(url.hash).toEqual('');
        expect(url.parameters).toEqual({});
    });

    it('should parse a variant protocol', () => {
        const uri = 'file://file.txt';
        const url = parseUrl(uri);
        expect(url.href).toEqual(uri);
        expect(url.domain).toEqual('file://file.txt');
        expect(url.protocol).toEqual('file');
        expect(url.host).toEqual('file.txt');
        expect(url.hostname).toEqual('file.txt');
        expect(url.port).toEqual(null);
        expect(url.path).toEqual('');
        expect(url.search).toEqual('');
        expect(url.hash).toEqual('');
        expect(url.parameters).toEqual({});
    });

    it('should parse a complex url', () => {
        const uri = 'https://www.sample.com:1234/info/get?name=Rudi&age=23#hash';
        const url = parseUrl(uri);
        expect(url.href).toEqual(uri);
        expect(url.domain).toEqual('https://www.sample.com:1234');
        expect(url.protocol).toEqual('https');
        expect(url.host).toEqual('www.sample.com:1234');
        expect(url.port).toEqual(1234);
        expect(url.path).toEqual('info/get');
        expect(url.search).toEqual('name=Rudi&age=23');
        expect(url.hash).toEqual('#hash');
        expect(url.parameters).toEqual({ name: 'Rudi', age: '23' });
    });
});
