# ADR 0004 — Partial dates and Persian calendar

**Status** Recommended after Phase 1.5, owner approval pending  
**Date** 24 November 2026

The source provides Bahman 1404 and Khordad 1404 as employment start months with unknown end dates and employment status.

Persist original calendar plus year, month and precision. Derive Gregorian ranges and display labels using tested conversion. Keep employment status independent of whether an end date was supplied.

Storing a converted start day simplifies date filtering but implies unsupported day precision. Persisting a display string protects wording but makes validation, ordering and localization fragile. Structured partial dates require explicit formatting tests and preserve the source information.

Use the source Persian month as the review default. Confirm the owner's preference for Persian month names versus Gregorian month spans in English before publishing. Test Esfand, year rollover and timezone behavior before launch.

[Date model and source policy](../architecture/data-model.md#persian-calendar-and-content-provenance)
