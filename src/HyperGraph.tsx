import React, {Component} from 'react'
import Graph from 'vis-react'

interface VisNode {
    id: number;
    label: string;
    shape?: string;
    color?: string;
}

interface VisEdge {
    from: number;
    to: number;
}

export class ID {
    id: number;
    label?: string;

    constructor(id: number, label?: string) {
        this.id = id;
        this.label = label;
    }

    toString() {
        if (this.label == null) {
            return this.id.toString();
        }
        return this.label;
    }
}

export class Node {
    id: ID;
    literal?: string;
    shape?: string;
    color: string;

    constructor(id: ID, literal?: string, shape = "ellipse", color = "#80b3ff") {
        this.id = id;
        this.literal = literal;
        this.shape = shape;
        this.color = color
    }

    toVisNode(): VisNode {
        return {
            id: this.id.id,
            shape: this.shape,
            label: this.literal !== undefined ? this.literal : this.id.toString(),
            color: this.color
        }
    }
}

export class HyperEdge {
    type: string;
    sources: ID[];
    hasTarget: boolean;

    constructor(type: string, sources: ID[], hasTarget: boolean = true) {
        this.type = type;
        this.sources = sources;
        this.hasTarget = hasTarget;
    }
}

interface HyperGraphProps {
    nodes: Node[];
    edges: HyperEdge[];
    options?: { hasTarget: boolean };
}

const optionsDefault = {
    hasTarget: true,
    layout: {
        hierarchical: false
    },
    edges: {
        color: '#000000'
    },
    nodes: {
        margin: 10
    }
};

export class HyperGraph extends Component<HyperGraphProps, any> {
    private readonly options: any;
    private readonly hasTarget: boolean;

    private events = {
        select: function (event: any) {
            let {nodes, edges} = event;
        }
    };

    constructor(props: HyperGraphProps) {
        super(props);
        const {hasTarget, ...options} = {...optionsDefault, ...props.options};
        this.hasTarget = hasTarget;
        this.options = options;
    }

    handleResize = () => {
        console.log("Trying rerender");
        this.forceUpdate();
    };

    componentDidMount() {
        this.handleResize();
        window.addEventListener('resize', this.handleResize)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize)
    }

    render() {
        console.log("rendering hyper graph");
        let maxId = Math.max(...this.props.nodes.map((value: Node) => {
            return value.id.id;
        }));

        let nodes: VisNode[] = this.props.nodes.map((value, index, array) => value.toVisNode());
        let edges: VisEdge[] = [];

        for (let edge of this.props.edges) {
            maxId += 1;
            let newNode = new Node(new ID(maxId), edge.type, "box", "#88cc00");
            nodes.push(newNode.toVisNode());
            edges = edges.concat(edge.sources.map((value: ID, index: number) => {
                if (this.hasTarget && edge.hasTarget && index === 0) {
                    return {to: value.id, from: newNode.id.id}
                } else if (!this.hasTarget || !edge.hasTarget) {
                    return {from: value.id, to: newNode.id.id, label: "arg " + (index + 1)}
                } else return {from: value.id, to: newNode.id.id, label: "arg " + index}
            }));
        }

        let graph = {
            nodes: nodes,
            edges: edges
        };

        console.log("returning new hyper graph");
        return (
            <Graph graph={graph} options={this.options} events={this.events}/>
        );
    }
}