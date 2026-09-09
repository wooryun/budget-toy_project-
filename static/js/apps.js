const state = {
    transactions: []
};


const modal =
    document.getElementById("transactionModal");

const openModalBtn =
    document.getElementById("openModalBtn");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const modalBackground =
    document.querySelector(".modal-background");

const form =
    document.getElementById("transactionForm");

const transactionList =
    document.getElementById("transactionList");

const typeFilter =
    document.getElementById("typeFilter");

const categoryFilter =
    document.getElementById("categoryFilter");

const categorySelect =
    document.getElementById("category");

const customCategory =
    document.getElementById("customCategory");

const incomeTotal =
    document.getElementById("incomeTotal");

const expenseTotal =
    document.getElementById("expenseTotal");

const balanceTotal =
    document.getElementById("balanceTotal");



/*
========================================
공통 함수
========================================
*/

function formatMoney(value) {

    return Number(value)
        .toLocaleString("ko-KR") + "원";
}


function formatDate(date) {

    if (!date) {
        return "-";
    }

    const parts = date.split("-");

    return `${parts[0]}.${parts[1]}.${parts[2]}`;
}


function getTypeText(type) {

    return type === "income"
        ? "수입"
        : "지출";
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}



/*
========================================
모달
========================================
*/

function openModal() {

    modal.classList.remove("hidden");

    document.body.style.overflow = "hidden";

    const dateInput =
        document.getElementById("date");

    if (!dateInput.value) {

        dateInput.value =
            new Date()
                .toISOString()
                .slice(0, 10);
    }

    document
        .getElementById("description")
        .focus();
}


function closeModal() {

    modal.classList.add("hidden");

    document.body.style.overflow = "";
}


function resetForm() {

    form.reset();

    document.getElementById("type").value =
        "expense";

    document.getElementById("date").value =
        new Date()
            .toISOString()
            .slice(0, 10);

    customCategory
        .classList
        .add("hidden");
}



/*
========================================
카테고리 직접 입력
========================================
*/

categorySelect.addEventListener(
    "change",
    () => {

        if (
            categorySelect.value === "custom"
        ) {

            customCategory
                .classList
                .remove("hidden");

            customCategory.required = true;

            customCategory.focus();

        } else {

            customCategory
                .classList
                .add("hidden");

            customCategory.required = false;

            customCategory.value = "";

        }

    }
);



/*
========================================
요약
========================================
*/

function updateSummary() {

    let income = 0;

    let expense = 0;


    for (
        const transaction
        of state.transactions
    ) {

        const amount =
            Number(transaction.amount);


        if (
            transaction.type === "income"
        ) {

            income += amount;

        } else {

            expense += amount;

        }

    }


    incomeTotal.textContent =
        formatMoney(income);

    expenseTotal.textContent =
        formatMoney(expense);

    balanceTotal.textContent =
        formatMoney(income - expense);
}



/*
========================================
카테고리 필터
========================================
*/

function updateCategoryFilter() {

    const currentValue =
        categoryFilter.value;


    const categories =
        [
            ...new Set(
                state.transactions
                    .map(
                        transaction =>
                            transaction.category
                    )
                    .filter(Boolean)
            )
        ];


    categories.sort();


    categoryFilter.innerHTML =
        `
        <option value="all">
            전체 카테고리
        </option>
        `;


    for (
        const category
        of categories
    ) {

        const option =
            document.createElement("option");

        option.value =
            category;

        option.textContent =
            category;

        categoryFilter.appendChild(
            option
        );

    }


    if (
        categories.includes(currentValue)
    ) {

        categoryFilter.value =
            currentValue;

    } else {

        categoryFilter.value =
            "all";

    }
}



/*
========================================
거래내역 출력
========================================
*/

function renderTransactions() {

    const selectedType =
        typeFilter.value;

    const selectedCategory =
        categoryFilter.value;


    const transactions =
        state.transactions.filter(
            transaction => {

                const typeMatch =
                    selectedType === "all" ||
                    transaction.type ===
                        selectedType;


                const categoryMatch =
                    selectedCategory === "all" ||
                    transaction.category ===
                        selectedCategory;


                return (
                    typeMatch &&
                    categoryMatch
                );

            }
        );


    if (
        transactions.length === 0
    ) {

        transactionList.innerHTML =
            `
            <tr class="empty-row">
                <td colspan="6">
                    표시할 내역이 없습니다.
                </td>
            </tr>
            `;

        return;
    }


    transactionList.innerHTML =
        transactions
            .map(transaction => {

                const sign =
                    transaction.type === "income"
                        ? "+"
                        : "-";


                return `
                <tr>

                    <td>
                        ${formatDate(
                            transaction.date
                        )}
                    </td>

                    <td>

                        <span
                            class="type-badge
                            ${transaction.type}">

                            ${getTypeText(
                                transaction.type
                            )}

                        </span>

                    </td>

                    <td>
                        ${escapeHtml(
                            transaction.category
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            transaction.description
                        )}
                    </td>

                    <td>

                        <span
                            class="amount
                            ${transaction.type}">

                            ${sign}${formatMoney(
                                transaction.amount
                            )}

                        </span>

                    </td>

                    <td>

                        <button
                            class="delete-btn"
                            data-id="${transaction.id}">

                            삭제

                        </button>

                    </td>

                </tr>
                `;

            })
            .join("");
}



/*
========================================
전체 렌더링
========================================
*/

function render() {

    updateSummary();

    updateCategoryFilter();

    renderTransactions();

}



/*
========================================
내역 추가
========================================
*/

form.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const formData =
            new FormData(form);


        const amount =
            Number(
                formData.get("amount")
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            alert(
                "금액은 1원 이상 입력해주세요."
            );

            return;

        }


        /*
        카테고리 처리

        일반 카테고리:
        식비 → 식비

        직접 입력:
        custom → customCategory 값
        */

        let category =
            formData.get("category");


        if (
            category === "custom"
        ) {

            category =
                formData
                    .get("customCategory")
                    .trim();


            if (!category) {

                alert(
                    "카테고리를 입력해주세요."
                );

                customCategory.focus();

                return;
            }

        }


        const transaction = {

            id:
                crypto.randomUUID(),

            type:
                formData.get("type"),

            date:
                formData.get("date"),

            category:
                category,

            description:
                formData.get(
                    "description"
                ),

            amount:
                amount

        };


        state.transactions.unshift(
            transaction
        );


        render();

        resetForm();

        closeModal();

    }
);



/*
========================================
삭제
========================================
*/

transactionList.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".delete-btn"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;


        state.transactions =
            state.transactions.filter(
                transaction =>
                    transaction.id !== id
            );


        render();

    }
);



/*
========================================
기타 이벤트
========================================
*/

openModalBtn.addEventListener(
    "click",
    openModal
);


closeModalBtn.addEventListener(
    "click",
    closeModal
);


cancelBtn.addEventListener(
    "click",
    closeModal
);


modalBackground.addEventListener(
    "click",
    closeModal
);


typeFilter.addEventListener(
    "change",
    renderTransactions
);


categoryFilter.addEventListener(
    "change",
    renderTransactions
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !modal.classList.contains("hidden")
        ) {

            closeModal();

        }

    }
);


const response = await fetch("/api/transactions");

const transactions = await response.json();

async function fetchTransactions() {
    GET /api/transactions
    const response = await fetch("/api/transactions");
    const transactions = await response.json();
    state.transactions = transactions;
    render();
}

loadTransactions();


/*
========================================
초기 실행
========================================
*/

render();