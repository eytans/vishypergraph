import React, {Component} from 'react';
import './App.css';
import {Container, Row, Col, Form, Button} from "react-bootstrap";
import {HyperGraph, Node, HyperEdge, ID} from './HyperGraph'
import { generate } from 'pegjs'
import Tracer from 'pegjs-backtrace'

interface AppState {
  nodes: Node[];
  edges: HyperEdge[];
}

export class App extends Component<Readonly<{}>, AppState> {
  textRef: any;

  constructor(props: Readonly<{}>) {
    super(props);
    this.textRef = React.createRef();
    this.state = {
      nodes: [],
      edges: []
    }
  }

  parseText(text: string, isPattern?: boolean): any {
    let parser = generate(`
    expression = exp:smallerexpression "{" exps:expressionlist "}" { return {type: 'tree', root:exp, subtrees: exps} } 
    / smallerexpression
    
    smallerexpression = root:identifier _ "(" exps:expressionlist ")" {
      var res = {type: 'node'};
      res[root['value']] = exps;
      return  res;
    }
    / number
    / identifier
    / literal
    
    expressionlist =  _ exp:expression? exps:( _ "," _ expression _ )* {
        if (exp === null) return [];
        else if (exps.length === 0) return exp;
        else return [exp].concat(exps.map(function(a){ return a[3] }))
      }
    
    identifier = lets:([^(),"])+ {return {type: 'identifier', value:lets.join("")}}
    
    number = digits:[0-9]+ {return {type: 'number', value:parseInt(digits.join(""), 10)}}
    
    literal = '"' lets:(!'"' .)* '"' {return {type: 'literal', value: lets.map(x => x[1]).join("")}}
    
    _  = [ \\t\\r\\n]*`);
    let tracer = new Tracer(text);
    let tree = null;
    try {
      tree = parser.parse(text, {tracer: tracer});
    } catch (e) {
      console.log(e);
      console.log(tracer.getBacktraceString());
    }
    console.log(tree);
    return tree;
  }

  static getEdges(tree: any): Array<any> {
    // hypergraph(set(h,h,...))
    let graphkey: string|undefined = Object.keys(tree).find(function(element: string) {
      return element.toLowerCase().includes('hypergraph');
    });

    if (graphkey === undefined) {
      throw new Error('bla');
    }

    console.log(graphkey);
    if (Array.isArray(tree[graphkey]['Set'])) return tree[graphkey]['Set'].map((e: any) => e['HyperEdge']);
    return [tree[graphkey]['Set']['HyperEdge']];
  }

  static extractId(hyperTermId: any) {
    let label = null;
    let value = -9999;
    if (Object.keys(hyperTermId).includes('Explicit')) {
      value = hyperTermId['Explicit']['HyperTermId']['value'];
      label = 'Explicit';
    } else if (Object.keys(hyperTermId).includes('Hole')) {
      value = -hyperTermId['Hole']['value'];
      label = 'Hole';
    } else if (Object.keys(hyperTermId).includes('Ignore')){
      label = 'Ignore';
    } else if (Object.keys(hyperTermId).includes('Repetition')) {
      value = hyperTermId['Repetition'][1]['value'];
      label = 'Repetition';
    } else if (Object.keys(hyperTermId).includes('Stream')) {
      value = hyperTermId['Repetition'][1]['value'];
      label = 'Repetition';
    } else return new ID(hyperTermId['HyperTermId']['value']);

    return new ID(value, label + '(' + value + ')');
  }

  static extractIdentifier(hyperTermIdentifier: any): string {
    if (Object.keys(hyperTermIdentifier).includes('Explicit')) {
      var literal = hyperTermIdentifier['Explicit']['HyperTermIdentifier']['Identifier'][0];
      return literal['value'];
    } else if (Object.keys(hyperTermIdentifier).includes('Hole')) {
      return "Hole(" + hyperTermIdentifier['Hole']['value'] + ")";
    } else if (Object.keys(hyperTermIdentifier).includes('Ignore')) {
      return  'Ignore';
    } else return hyperTermIdentifier['HyperTermIdentifier']['Identifier'][0]['value'];
  }

  static parseEdge(edge: any) {
    let eType = App.extractIdentifier(edge[1]);
    let target = [App.extractId(edge[0])];
    let sources = edge[2]['List'];
    if (sources === undefined) sources = [];
    else if (Array.isArray(sources))
      sources = sources.map(App.extractId);
    else sources = [App.extractId(sources)];
    if (["type", "spacecomplex", "timecomplex"].includes(eType)) return new HyperEdge(eType, sources, false);
    return new HyperEdge(eType, target.concat(sources));
  }

  handleClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    let text = this.textRef.current.value;
    if (typeof text === 'string') {
      let tree = this.parseText(text);
      let edges = App.getEdges(tree).map(e => App.parseEdge(e));
      let nodes = new Map<number, Node>(edges.flatMap(function (e: HyperEdge) {
        console.log(e.sources);
        return e.sources.map(f => [f.id, new Node(f)])
      }));
      this.setState({nodes: Array.from(nodes.values()), edges: edges})
    }
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
    console.log("rendering app");
    return (
    <Container style={{height: '100vh', 'minHeight': '100vh'}}>
      <Row>
        <Col><Button onClick={this.handleClick.bind(this)}>Draw Graph!</Button>
        <Form.Control ref={this.textRef} style={{width: '75vh'}} type="text" placeholder="Enter hyper graph text"/></Col>
      </Row>
      <Row style={{height: '100%'}}>
        <HyperGraph
            edges={this.state.edges}
            nodes={this.state.nodes}/>
      </Row>
    </Container>);
  }
}

export default App;
