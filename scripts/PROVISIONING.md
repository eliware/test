# Convention check tree

The checks tree is provisioned to mirror the published convention hierarchy.
Each convention check has a stable directive-derived path, and the execution
layer discovers checks from that tree rather than depending on the private
conventions repository at runtime.

Some modules are deterministic implementations; modules for requirements that
cannot be validated from repository-local evidence remain explicit pass-through
placeholders. A placeholder is not evidence that the corresponding convention
has been enforced. New enforcement belongs in the most specific directive
module that owns the contract, with its matching test under `tests/checks/`.
