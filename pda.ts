function hidden(...args: any[]) { };

export class Node {
    /** Start State */
    isStartState: boolean;
    /** Accept State */
    isAcceptState: boolean;
    children: Edge[];

    label: string;

    private get image(): string {
        if (this.isStartState && this.isAcceptState) {
            return "start_accept_state.svg";
        }
        if (this.isAcceptState) {
            return "accept_state.svg";
        }
        if (this.isStartState) {
            return "start_state.svg";
        }
        return "";
    }

    private get origin(): { x: number, y: number } {
        return {
            x: this.isStartState ? 10 : 0,
            y: 0
        };
    }
}

export class Edge {
    onInput: string;
    onStack: string;
    writeStack: string;
    destination: Node;

    get label() {
        const isEmpty = (s: string) => !s || s.length === 0;
        return (!isEmpty(this.onInput) ? this.onInput : "λ") + ", " + (!isEmpty(this.onStack) ? this.onStack : "λ") + "; " + (!isEmpty(this.writeStack) ? this.writeStack : "λ");
    }
}

export class Graph {
    nodes: Node[];
    emptyStack: string;
}

export type Nodes = Node;
export type Edges = Edge;

export class State {
    @hidden
    active: Node[];
    @hidden
    activeStates: GeneralSet;
    public stacks: [Node, string][] = [];

    public message: string;

    constructor(
        activeStates: GeneralSet,
        @hidden public inputLeft: string) {
        this.active = [...activeStates.values()].map((s) => s.node);
        [...activeStates.values()].forEach((s) => {
            this.activeStates = activeStates;
            this.stacks.push([s.node, s.stack]);
            this.message = inputLeft;
        });
    }
}

export class ActiveState {
    constructor(public node: Node, public stack: string) { };

    equals(other: ActiveState) {
        return this.node === other.node && this.stack === other.stack;
    };
}

export function start(input: Graph, data: string): State | boolean {
    const startStates = input.nodes.filter(n => n.isStartState);
    if (startStates.length === 0) {
        throw new Error("no start state");
    }
    if (!input.emptyStack || input.emptyStack.length === 0) {
        throw new Error("provide a symbol for empty stacks");
    }

    return new State(new GeneralSet(startStates.map((n) => new ActiveState(n, input.emptyStack))), data);
}

export function step(current: State): State | boolean {
    if (current.inputLeft === "") {
        return current.active.filter((n) => n.isAcceptState).length > 0;
    }

    let nextSymbol = current.inputLeft.charAt(0);
    let remainingInput = current.inputLeft.substring(1);

    const f = (activeStates: GeneralSet, nextSymbol: string) => {
        const r = new GeneralSet([]);

        [...activeStates.values()].forEach((s) => {
            let topOfStack = s.stack.charAt(0);

            s.node.children.forEach((e) => {
                if ((nextSymbol === e.onInput || (e.onInput === "" || e.onInput === undefined) && nextSymbol === "") && topOfStack === e.onStack) {
                    r.add(new ActiveState(e.destination, (e.writeStack ? e.writeStack : "") + s.stack.substring(1)));
                }
            });
        });

        return r;
    };

    // Make sure we follow any change of lambdas
    const nextStates = f(current.activeStates, nextSymbol);
    while (true) { // This can't be an infinite loop because the set of possible states is bounded
        const previousSize = nextStates.size;
        [...f(nextStates, "").values()].forEach((s) => nextStates.add(s));
        if (previousSize === nextStates.size) {
            break;
        }
    }


    if (nextStates.size === 0) {
        return false;
    }


    return new State(nextStates, remainingInput);
}

class GeneralSet {
    private set: ActiveState[] = [];
    [Symbol.iterator]: () => Iterable<ActiveState>;

    constructor(initial: ActiveState[]) {
        this[Symbol.iterator] = this.values;

        if (initial) {
            initial.forEach((i) => this.add(i));
        }
    }

    add(item: ActiveState) {
        if (!this.set.find((i) => item.equals(i))) {
            this.set.push(item);
        }
    }

    values() {
        return this.set;
    }

    get size() {
        return this.set.length;
    }
}
