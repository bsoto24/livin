---
date: 2026-10-08
spec: "005"
tags: [adr, sdd-plan, sdd-review, spec]
---

# Lección: cotejar los límites que acepta un ADR con los NFR de la spec antes de aprobar el plan

## Contexto

Los ADR de la 005 se escribieron y aceptaron antes que la spec. Uno de ellos aceptó como límite que dos cambios en el mismo milisegundo no se distinguirían. Después la spec incorporó un NFR de Reliability que exigía exactamente lo contrario.

## Qué pasó

Spec y ADR quedaron aprobados sin que se comparara el límite aceptado con el NFR nuevo. El plan siguió al ADR, la implementación siguió al plan y la contradicción apareció solo en `sdd-review` modo B. Costó una ronda extra de revisión y un cambio de código en una función compartida (`tocar`) ya verificada en el teléfono.

## Qué hacer la próxima vez

Al terminar `sdd-specify`, repasar los ADR ya aceptados buscando frases como "límite aceptado", "no ocurre en la práctica" o "queda fuera" y cotejarlas una por una con los NFR y los AC de la spec. Si hay contradicción, usar `sdd-spec-update` o enmendar el ADR antes de planificar.

## Señales a vigilar

ADR escritos antes de la spec; NFR de Reliability que mencionan casos límite (mismo instante, reloj detenido, datos corruptos); "Cons" de un ADR que descartan un caso por improbable.
