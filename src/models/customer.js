class Customer {
    constructor({ customerNO, firstName, lastName, phone, email, address }) {
        this.customerNO = customerNO;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.email = email;
        this.address = address;
    }

    static fromGSheet(record) {
        return new Customer({
            customerNO: record[0]?.toString(),
            firstName: record[1]?.toString(),
            lastName: record[2]?.toString(),
            phone: record[3]?.toString(),
            email: record[4]?.toString(),
            address: record[5]?.toString(),
        });
    }
}

module.exports = Customer;
