# Database Models for Order/Sequence Feature

## Models to Update

1. **Order** - Add `order` (order of submission) field and related fields for sequence management
2. **OrderItem** - Add `sequence`, `fieldOrder`, `sequenceDisplayText` fields
3. **OrderItemField** - Add `sequence`, `fieldOrder`, `sequenceDisplayText` fields
4. **Sequence** - Create model for storing sequence/order definition
5. **SequenceDisplay** - Create model for display customization of sequences
6. **SequenceItem** - Create model for individual items in a sequence
7. **Field** - Add `sequenceId` field to link to parent sequence
8. **Submission** - Add `orderId` field to link submissions to orders
9. **SubmissionItem** - Add `sequenceId` and `sequenceItemId` for tracking in sequence
10. **SubmissionItemField** - Add `sequenceId`, `sequenceItemId` for tracking

## Additional Considerations

- Need to add `isActive`, `startDate`, `endDate` fields to sequence-based models for lifecycle management
- Consider audit fields (`createdBy`, `createdAt`, `updatedBy`, `updatedAt`) for traceability
- Check if `status` field is needed for order workflow (PENDING, IN_PROGRESS, COMPLETED, etc.)
