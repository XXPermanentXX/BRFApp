module.exports = {
  "extends": "stylelint-config-suitcss",
  "ignoreFiles": [
    "public/**",
    "node_modules/**"
  ],
  "rules": {
    "order/properties-alphabetical-order": null,
    "rule-empty-line-before": ["always-multi-line", {
      "except": [
        "first-nested"
      ]
    }],
    // The `:root:not(.has-js)` is used to target non-js contexts
    "suitcss/root-no-standard-properties": null,
    "suitcss/selector-root-no-composition": null
  }
}
