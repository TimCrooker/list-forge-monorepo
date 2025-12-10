import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Card, CardContent, LoadingButton, AppContent } from '@listforge/ui';
import { Package } from 'lucide-react';
import { useItemForm } from '@/hooks';
import {
  ItemPhotoUpload,
  ItemBasicFields,
  ItemPricingFields,
  ItemShippingFields,
  ItemAdvancedFields,
} from '@/components/items';

export const Route = createFileRoute('/_authenticated/items/new')({
  component: NewItemPage,
});

function NewItemPage() {
  const navigate = useNavigate();
  const form = useItemForm();

  return (
    <AppContent
      title="Create New Item"
      description="Manually add an item to your inventory"
      statusIndicator={<Package className="h-5 w-5" />}
      breadcrumbs={[
        { label: 'Inventory', href: '/items' },
        { label: 'New Item', href: '/items/new' },
      ]}
    >
      {/* Validation Errors */}
      {form.validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <ul className="list-disc list-inside space-y-1 text-destructive">
              {form.validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <form onSubmit={form.handleSubmit} className="space-y-6">
        {/* Photos */}
        <ItemPhotoUpload
          files={form.files}
          previews={form.previews}
          draggedIndex={form.draggedIndex}
          dropzoneProps={form.dropzoneProps}
          onRemoveFile={form.removeFile}
          onDragStart={form.handleDragStart}
          onDragOver={form.handleDragOver}
          onDragEnd={form.handleDragEnd}
        />

        {/* Core Details */}
        <ItemBasicFields
          title={form.title}
          onTitleChange={form.setTitle}
          subtitle={form.subtitle}
          onSubtitleChange={form.setSubtitle}
          description={form.description}
          onDescriptionChange={form.setDescription}
          condition={form.condition}
          onConditionChange={form.setCondition}
        />

        {/* Pricing & Inventory */}
        <ItemPricingFields
          defaultPrice={form.defaultPrice}
          onDefaultPriceChange={form.setDefaultPrice}
          quantity={form.quantity}
          onQuantityChange={form.setQuantity}
          location={form.location}
          onLocationChange={form.setLocation}
          costBasis={form.costBasis}
          onCostBasisChange={form.setCostBasis}
        />

        {/* Shipping */}
        <ItemShippingFields
          shippingType={form.shippingType}
          onShippingTypeChange={form.setShippingType}
          flatRateAmount={form.flatRateAmount}
          onFlatRateAmountChange={form.setFlatRateAmount}
          domesticOnly={form.domesticOnly}
          onDomesticOnlyChange={form.setDomesticOnly}
        />

        {/* Category & Attributes (Collapsible) */}
        <ItemAdvancedFields
          showAdvanced={form.showAdvanced}
          onToggleAdvanced={() => form.setShowAdvanced(!form.showAdvanced)}
          categoryPath={form.categoryPath}
          onCategoryPathChange={form.setCategoryPath}
          attributes={form.attributes}
          newAttrKey={form.newAttrKey}
          onNewAttrKeyChange={form.setNewAttrKey}
          newAttrValue={form.newAttrValue}
          onNewAttrValueChange={form.setNewAttrValue}
          onAddAttribute={form.addAttribute}
          onRemoveAttribute={form.removeAttribute}
        />

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/items' })}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            size="lg"
            isLoading={form.isSubmitting}
            loadingText="Creating..."
          >
            Create Item
          </LoadingButton>
        </div>
      </form>
    </AppContent>
  );
}
