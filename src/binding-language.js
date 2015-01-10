import {BindingLanguage} from 'aurelia-templating';
import {Parser, ObserverLocator, BindingExpression, NameExpression, ONE_WAY} from 'aurelia-binding';
import {SyntaxInterpreter} from './syntax-interpreter';

export class TemplatingBindingLanguage extends BindingLanguage {
  static inject() { return [Parser, ObserverLocator,SyntaxInterpreter]; }
	constructor(parser, observerLocator, syntaxInterpreter){
    this.parser = parser;
    this.observerLocator = observerLocator;
    this.syntaxInterpreter = syntaxInterpreter;
    this.interpolationRegex = /\${(.*?)}/g;
    syntaxInterpreter.language = this;
  }

	parseAttribute(resources, element, attrName, attrValue, existingInstruction){
		var parts = attrName.split('.'),
				instruction;

		if(parts.length == 2){
			instruction = this.syntaxInterpreter.interpret(
				parts[1].trim(),
				resources,
				element,
				parts[0].trim(),
				attrValue,
        existingInstruction
			);

      if(!existingInstruction){
        instruction.originalAttrName = attrName;
      }
		} else if(attrName == 'ref'){
      return new NameExpression(attrValue, 'element');
    } else {
			var expression = this.parseContent(resources, attrName, attrValue);
			if(expression){
				instruction = existingInstruction || {attrName:attrName, attributes:{}};
				instruction.attributes[attrName] = expression;
			}
		}

		return instruction;
	}

	parseText(resources, value){
    return this.parseContent(resources, 'textContent', value);
  }

  parseContent(resources, attrName, attrValue){
    var expressionText, expression;

    var parts = attrValue.split(this.interpolationRegex);
    if (parts.length <= 1) { //no expression found
      return null;
    }

    parts.forEach(function(part, index) {
      if (index % 2 === 0) {
        //plain text parts
        parts[index] = "'" + part + "'";
      } else {
        //expression parts
        parts[index] = "(" + part + ")";
      }
    });

    expressionText = parts.join('+');

    expression = new BindingExpression(
      this.observerLocator,
      attrName === 'class' ? 'className' : attrName,
      this.parser.parse(expressionText), 
      ONE_WAY,
      resources.valueConverterLookupFunction
    );

    expression.attribute = attrName;

    return expression;
  }
}