// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestEvent {

    struct Book {
        string title;
        string author;
    }

    event senderEvent(address sender, Book _book);

    function testEvent() public {
        Book memory book = Book('Learn Solidity', 'scz');
        emit senderEvent(msg.sender, book);
    }
}
