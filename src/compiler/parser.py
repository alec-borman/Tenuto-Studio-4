from lark import Lark

grammar = r'''
start: statement*

?statement: def_stmt 
          | measure_stmt 
          | meta_stmt 
          | assignment 
          | invocation

def_stmt: "def"i IDENTIFIER "{" statement* "}"
measure_stmt: "measure"i IDENTIFIER "{" statement* "}"
meta_stmt: "meta"i IDENTIFIER "{" statement* "}"

assignment: IDENTIFIER ":" expression
invocation: "$" IDENTIFIER

?expression: voice 
           | map_expr 
           | chord 
           | attribute 
           | IDENTIFIER 
           | STRING 

voice: "<[" expression* "]>"
map_expr: "@{" (IDENTIFIER ":" expression)* "}"
chord: "[" NOTE* "]"
attribute: IDENTIFIER "." IDENTIFIER

IDENTIFIER: /[a-zA-Z_][a-zA-Z0-9_]*/
STRING: /"[^"]*"/
NOTE: /[a-gA-G][#bB]?[0-9]?/

COMMENT: /%%.*/
%ignore COMMENT
%ignore /[ \t\n\f\r]+/
'''

def get_parser():
    return Lark(grammar, start='start')

def parse(text):
    parser = get_parser()
    return parser.parse(text)
