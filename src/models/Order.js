class Order {
    constructor({ orderNumber, customerNO, folderLink, orderDate, status, notes, image }) {
        this.orderNumber = orderNumber;
        this.customerNO = customerNO;
        this.folderLink = folderLink;
        this.orderDate = orderDate ? new Date(orderDate) : null;
        this.status = status || '';
        this.notes = notes;
        this.image = image;
    }

    static fromGSheet(record) {
        return new Order({
            orderNumber: record[0],
            customerNO: record[1],
            folderLink: record[2],
            orderDate: record[3] ? new Date(new Date(record[3]).getTime() + 2 * 60 * 60 * 1000).toISOString() : undefined,
            status: record[4] || '',
            notes: record.length > 5 ? record[5] : undefined,
            image: record.length > 6 ? record[6] : undefined,
        });
    }
}

module.exports = Order;
