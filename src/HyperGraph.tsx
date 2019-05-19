import React, { Component } from 'react'
import Graph from 'vis-react'

interface VisNode {
    id: number;
    label: string;
    shape?: string;
}

interface VisEdge {
    from: number;
    to: number;
}

export class ID {
    id: number;
    constructor(id: number) {
        this.id = id;
    }

    toString() {
        return this.id.toString();
    }
}

export class Node {
    id: ID;
    literal?: string;
    shape?: string;

    constructor(id: ID, literal?: string, shape = "ellipse") {
        this.id = id;
        this.literal = literal;
        this.shape = shape;
    }

    toVisNode(): VisNode {
        return {id: this.id.id, shape: this.shape, label: this.literal !== undefined ? this.literal : this.id.toString()}
    }
}

export class HyperEdge {
    type: string;
    sources: ID[];

    constructor(type: string, sources: ID[]) {
        this.type = type;
        this.sources = sources;
    }
}

interface HyperGraphProps {
    nodes: Node[];
    edges: HyperEdge[];
    options?: {hasTarget: boolean};
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
    private options: any;
    private hasTarget: boolean;

    private events = {
        select: function(event: any) {
            var { nodes, edges } = event;
        }
    };

    constructor(props: HyperGraphProps) {
        super(props);
        const {hasTarget, ...options} = {...optionsDefault, ...props.options};
        this.hasTarget = hasTarget;
        this.options = options;
    }


    render() {
        var maxId = Math.max(...this.props.nodes.map((value: Node) => { return value.id.id; }));

        // var origNodes = new Map<ID, VisNode>(
        //     this.props.nodes.map((value, index, array) => {
        //         return [value.id, value.toVisNode()];
        //     })
        // );

        // if (!this.props.edges.every(value => value.sources.every(value1 => origNodes.has(value1)))) {
        //     console.error("Some edge has a node ID which was not in nodes");
        //     throw Error("Edge missing a node in hypergraph input");
        // }

        var nodes: VisNode[] = this.props.nodes.map((value, index, array) => value.toVisNode());
        var edges: VisEdge[] = [];

        for (var edge of this.props.edges) {
            maxId += 1;
            var newNode = new Node(new ID(maxId), edge.type, "box");
            nodes.push(newNode.toVisNode());
            edges = edges.concat(edge.sources.map((value: ID, index: number) => {
                if (this.hasTarget && index === 0) {
                    return {to: value.id, from: newNode.id.id}
                }
                return {from: value.id, to: newNode.id.id, label: "arg " + index}
            }));
        }

        var graph = {
            nodes: nodes,
            edges: edges
        };

        return (
            <Graph graph={graph} options={this.options}  events={this.events}/>
        );
    }
}