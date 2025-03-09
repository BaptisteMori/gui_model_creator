# GUI model creator

_Created mainly using claude AI because I don't like web development._

A simple tool to create graph model, to unify common content.


## Model save structure

```json
{
  "nodes": [
    {
      "name": "Person",
      "labels": ["Person", "User"],
      "properties": [
        {"name": "name", "type": "str", "required": true, "description": "..."}
      ]
    }
  ],
  "relationships": [
    {
      "name": "KNOWS",
      "start_node": "Person",
      "end_node": "Person",
      "properties": [
        {"name": "since", "type": "int", "description": "..."}
      ]
    }
  ]
}
```