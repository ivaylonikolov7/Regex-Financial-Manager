function Record(id, date, time,amount, payee, correction, note, categoryId, subcategoryId, description) {
    this.id = id;
    this.date = date + ' ' + time;
    this.amount = amount;
    this.payee = payee;
    this.correction = correction;
    this.note = note;
    this.categoryId = categoryId;
    this.subcategoryId = subcategoryId;
    this.description = description;
}