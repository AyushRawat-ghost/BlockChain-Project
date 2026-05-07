// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRegistryCheck {
    function isDoctor(address _addr) external view returns (bool);
    function isPatient(address _addr) external view returns (bool);
}

contract BillingContract {
    IRegistryCheck public registries;

    uint256 public invoiceCount;

    struct Invoice {
        uint256 id;
        address patient;
        address provider; // Doctor or Hospital
        uint256 amount;
        bool isPaid;
        string cid; // IPFS hash to the invoice PDF/JSON
    }

    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public patientInvoices;

    event InvoiceGenerated(uint256 indexed id, address indexed provider, address indexed patient, uint256 amount, string cid);
    event InvoicePaid(uint256 indexed id, address indexed patient, uint256 amount);

    constructor(address _registries) {
        registries = IRegistryCheck(_registries);
    }

    function generateInvoice(address _patient, uint256 _amount, string calldata _cid) external {
        require(registries.isDoctor(msg.sender), "Only registered provider can generate invoice");
        require(registries.isPatient(_patient), "Invalid patient address");

        invoiceCount++;
        invoices[invoiceCount] = Invoice({
            id: invoiceCount,
            patient: _patient,
            provider: msg.sender,
            amount: _amount,
            isPaid: false,
            cid: _cid
        });

        patientInvoices[_patient].push(invoiceCount);

        emit InvoiceGenerated(invoiceCount, msg.sender, _patient, _amount, _cid);
    }

    function payInvoice(uint256 _invoiceId) external payable {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.id != 0, "Invoice does not exist");
        require(!invoice.isPaid, "Invoice already paid");
        require(msg.value == invoice.amount, "Incorrect payment amount");

        invoice.isPaid = true;

        (bool success, ) = payable(invoice.provider).call{value: msg.value}("");
        require(success, "ETH transfer failed");

        emit InvoicePaid(_invoiceId, invoice.patient, msg.value);
    }

    function getPatientInvoices(address _patient) external view returns (uint256[] memory) {
        return patientInvoices[_patient];
    }
}
