export namespace main {
	
	export class StackComponent {
	    stack: string;
	    component: string;
	
	    static createFrom(source: any = {}) {
	        return new StackComponent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.stack = source["stack"];
	        this.component = source["component"];
	    }
	}

}

