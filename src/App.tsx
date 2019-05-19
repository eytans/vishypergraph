import React, {Component} from 'react';
import './App.css';
import {Container, Row, Col, Form, Button} from "react-bootstrap";
import {HyperGraph, Node, HyperEdge, ID} from './HyperGraph'
import { generate } from 'pegjs'
import Tracer from 'pegjs-backtrace'
import {number} from "prop-types";

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

  parseText(text: string): {nodes: Node[], edges: HyperEdge[]} {
    let parser = generate(`
    expression = exp:smallerexpression "{" exps:expressionlist "}" { return ["{}", exp, exps] } 
    / smallerexpression
    
    smallerexpression = root:identifier _ "(" exps:expressionlist ")" { return [root, exps] }
    / number 
    / identifier
    
    expressionlist =  _ exp:expression? exps:( _ "," _ expression _ )* {
        if (exp === null) return [];
        else return [exp].concat(exps.map(function(a){ return a[3] }))
      }
    
    identifier = lets:([^(),])+ {return lets.join("")}
    
    number = digits:[0-9]+ {return parseInt(digits.join(""), 10)}
    
    _  = [ \\t\\r\\n]*`);
    let tracer = new Tracer(text);
    var tree = null;
    try {
      tree = parser.parse(text, {tracer: tracer});
    } catch (e) {
      console.log(e);
      console.log(tracer.getBacktraceString());
    }
    console.log(tree);
    var edges = tree[1][0][1].map(function(e: Array<any>) {
      var edge = e[1];
      return new HyperEdge(
        edge[1][1][0][1][0],
        edge[0][1].concat(edge[2][1].map(function(l: any){
          return l[1][0]
        })).map((x: any) => new ID(x))
    )
    });
    var nodes = new Map<number, Node>(edges.flatMap(function (e: HyperEdge) {
      return e.sources.map(f => [f.id, new Node(f)])
    }));
    console.log(edges);
    console.log(nodes);
    return {nodes: Array.from(nodes.values()), edges: edges}
  }

  handleClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    let text = this.textRef.current.value;
    if (typeof text === 'string') {
      var {nodes, edges} = this.parseText(text);
      this.setState({nodes: nodes, edges: edges})
    }
  }

  render() {
    return <Container style={{height: '100vh', 'minHeight': '100vh'}}>
      <Form as={Row}>
        <Form.Group controlId="hypergraphtextform">
          <Col>
            <Form.Control ref={this.textRef} style={{width: '95vh'}} type="text" placeholder="Enter hyper graph text"/>
          </Col>
          <Col>
              <Button onClick={this.handleClick.bind(this)}>Draw!</Button>
          </Col>
        </Form.Group>
      </Form>
      <Row style={{height: '100%'}}>
        <HyperGraph
            edges={this.state.edges}
            nodes={this.state.nodes}/>
      </Row>
    </Container>
  }
}

export default App;
