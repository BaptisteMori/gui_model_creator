# GUI model creator

_Created mainly using claude AI because I don't like web development._
_It still needs a lot of update_

A simple tool to create graph model, to unify common content.

It allows creation, update, deletion of nodes and relations, with properties.
When the model is finished, it can be exported in json without the structure showed in the [Model save structure](#model-save-structure).
A same file can be imported to be modified.


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


## Interface

![alt text](assets/gui.jpg)


## Improvementss

- merge of models
- saving of node positions
  - actually, when the nodes are manually positioned, when there is a refresh, they come back to their original positions

- better graphic design