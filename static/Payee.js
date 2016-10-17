
var Payee = function(id, name, description, categoryId, subcategoryId)
{
    this.id = id;
    this.name = name;
    this.description = description;
    this.setCategoryId(categoryId);
    this.setSubcategoryId(subcategoryId);
};

Payee.prototype.setCategoryId = function(categoryId)
{
    if (categoryId != 'Select category')
    {
        this.categoryId = categoryId
    }
}
Payee.prototype.getCategoryId = function()
{
    return this.categoryId;
}

Payee.prototype.setSubcategoryId = function(subcategoryId) {
    if (subcategoryId != 'Select subcategory')
    {
        this.subcategoryId = subcategoryId
    }
}
Payee.prototype.getSubcategoryId = function()
{
    return this.subcategoryId;
}