import { State } from '@vorplex/core';
import { ShtmlDocument } from '@vorplex/shtml';

export interface PlatformState {
}

export class PlatformService {

    public shtml: ShtmlDocument;
    public state = new State<PlatformState>({

    });

    public async fetch() {
        this.shtml = await ShtmlDocument.fetch('/assets/example/index.shtml');
        // this.shtml = await ShtmlDocument.fetch('/assets/example/gpt-case-management.shtml');
    }

}
