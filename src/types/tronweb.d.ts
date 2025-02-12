declare module 'tronweb' {
  class TronWeb {
    constructor(
      fullNode: any,
      solidityNode: any,
      eventServer: string,
      privateKey: string
    );
    setAddress(address: string): void;
    trx: any;
    address: any;
  }
  namespace TronWeb {
    namespace providers {
      class HttpProvider {
        constructor(url: string);
      }
    }
  }
  export = TronWeb;
} 