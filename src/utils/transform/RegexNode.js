const js2xmlparser = require('js2xmlparser');

export default class RegexNode {
  constructor(node) {
    this.node = node;
  }

  getMatchingFlag() {
    const { expressionType, caseSensitivity, canonEq, multiline, unixLines } =
      this.node;

    let matchingFlag = '';
    if (expressionType === 'literal') {
      matchingFlag = 'LITERAL';
      if (caseSensitivity === 'ignore') {
        matchingFlag += ' CASE_INSENSITIVE';
      } else if (caseSensitivity === 'match-unicode') {
        matchingFlag += ' CASE_INSENSITIVE UNICODE';
      }
    }
    if (expressionType === 'regular') {
      if (caseSensitivity === 'ignore') {
        matchingFlag += 'CASE_INSENSITIVE';
      } else if (caseSensitivity === 'match-unicode') {
        matchingFlag += 'CASE_INSENSITIVE UNICODE';
      } else if (caseSensitivity === 'match') {
        matchingFlag += 'DOTALL';
      }
      if (canonEq) {
        matchingFlag += ' CANON_EQ';
      }
      if (multiline) {
        matchingFlag += ' MULTILINE';
      }
      if (unixLines) {
        matchingFlag += ' UNIX_LINES';
      }
    }
    return matchingFlag;
  }

  getRange() {
    const { tokenRange } = this.node;
    let min, max;
    if (tokenRange.checked) {
      [min, max] = tokenRange.range;
    }
    return { min, max };
  }

  transform() {
    const { label, regexInput: pattern } = this.node;
    const matchingFlag = this.getMatchingFlag();
    const { min, max } = this.getRange();
    const jsonStructure = {
      '@': {
        module: label,
        name: label,
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:noNamespaceSchemaLocation': 'schema/target_lang_spec.xsd',
      },
      'input-concepts': {
        'input-concept': {
          '@': {
            module: '',
            name: 'Document',
          },
        },
      },
      rule: {
        'input-spec': {
          'input-span': {
            '@': {
              'input-concept-module': '',
              'input-concept-name': 'Document',
              'input-field-name': 'text',
            },
          },
        },
        'output-spec': {
          field: {
            '@': {
              name: label, //node name
            },
          },
        },
        'rule-spec': {
          'regex-match': {
            '@': {
              'matching-flag': matchingFlag,
            },
            'regex-pattern': pattern,
          },
        },
      },
    };
    if (min != undefined && max != undefined) {
      jsonStructure['rule']['rule-spec']['regex-match']['token-constraint'] = {
        '@': {
          min,
          max,
        },
      };
    }
    return js2xmlparser.parse('concept', jsonStructure);
  }
}