function select_all(selectall, selectones) {
    for (let i = 0; i < selectones.length; i++) {
        if (selectones[i].disabled === false) {
            selectones[i].checked = selectall.checked
        }

    }

}

function select_one(selectall, selectones) {
    var isAllChecked = true;
    for (let i = 0; i < selectones.length; i++) {

        if (selectones[i].checked === false && selectones[i].disabled === false) {
            isAllChecked = false;
            break
        }
    }
    selectall.checked = isAllChecked
}


Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};