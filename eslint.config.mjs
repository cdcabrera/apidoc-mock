import { node, jest } from '@cdcabrera/eslint-config-toolkit';

export default [
  ...node,
  ...jest,
  {
    languageOptions: {
      globals: {
        generateFixture: 'readonly'
      }
    },
    rules: {
      'jsdoc/check-tag-names': [
        2,
        {
          definedTags: [
            'api',
            'apiDescription',
            'apiError',
            'apiErrorExample',
            'apiGroup',
            'apiHeader',
            'apiMock',
            'apiParam',
            'apiSuccess',
            'apiSuccessExample'
          ]
        }
      ],
      'jsdoc/no-undefined-types': 0
    }
  }
];
