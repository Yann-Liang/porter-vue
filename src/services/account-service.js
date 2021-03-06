const moment = require('moment'),
    fs = require('fs')
    ;

let savePath = ``;

class AccountService {
    constructor(type) {
        this.type = type;//交易所类型
        this.balance = {};//账户财务
        this.accounts = {};//账户列表
        this.balanceHistory = {
            balance: null,
            recordedTime: ''//上次记录时间
        };
        savePath = `./static/exchange/${this.type}/balance/balance.json`
        //加载旧数据
        fs.readFile(savePath, 'utf8', (err, data) => {
            if (err) {
                console.warn(err);
            } else {
                data ? this.balanceHistory = JSON.parse(data) : '';
            };

        });

    }
    //
    removeEmptyData(list) {
        return new Promise((resolve, reject) => {
            if (list && list.length) {
                const len = list.length;
                let balance = {};
                for (let i = 0, item; i < len; i++) {
                    item = list[i];
                    if (item.balance > 0) {
                        typeof balance[item.currency] == "undefined" ? balance[item.currency] = { trade: 0, frozen: 0 } : '';
                        balance[item.currency][item.type] = item.balance;
                    }
                }
                this.balance = balance;
                resolve(balance);
            } else {
                reject();
            }
        });
    }
    /**
     * @description 格式化
     *  将{balance:'余额',currency:'币种',type:'类型 trade: 交易余额，frozen: 冻结余额'}
     *  改为 currency{trade,frozen}
     *
     * @param {Array} list
     * @returns
     * @memberof AccountService
     */
    formatBalance(list) {
        if (list && list.length) {
            const len = list.length;
            let balance = {};
            for (let i = 0, item; i < len; i++) {
                item = list[i];
                typeof balance[item.currency] == "undefined" ? balance[item.currency] = { trade: 0, frozen: 0 } : '';
                balance[item.currency][item.type] = item.balance;
            }
            this.balance = balance;
            return balance;
        }
        return null;
    }

    getAccountBalanceContent() {
        const list = this.balance,
            { balance, recordedTime } = this.balanceHistory,//上次财务情况
            time = moment().format("YYYY年MM月DD日HH:mm"),
            subject = `[财务报告]${time}${this.type}账户余额`;

        let html = [`<table border="1" style="text-align:center;border-collapse:collapse;">
                        <caption>${subject}</caption>
                        <thead>
                             <tr>
                                <th>序号</th>
                                <th>币种</th>
                                <th>可用</th>
                                <th>冻结</th>
                                <th>上次可用</th>
                                <th>上次冻结</th>
                                <th>总计</th>
                                <th>${recordedTime}总计</th>
                                <th>差额</th>
                            </tr>
                        </thead>
                        <tbody>`
        ],
            i = 0,
            oldFrozen,
            oldTrade,
            oldTotal;


        for (const key in list) {
            const item = list[key],
                trade = item.trade ? Number(item.trade) : 0,
                frozen = item.frozen ? Number(item.frozen) : 0,
                total = trade + frozen
                ;

            if (balance&&balance[key]) {
                oldFrozen = balance[key].frozen;
                oldTrade = balance[key].trade;
                oldTotal = balance[key].total;
            }

            list[key].total = total;

            html.push(`<tr>
                            <td>${++i}</td>
                            <td>${key}</td>
                            <td>${trade}</td>
                            <td>${frozen}</td>
                            <td>${oldTrade}</td>
                            <td>${oldFrozen}</td>
                            <td>${total}</td>
                            <td>${oldTotal}</td>
                            <td>${total - oldTotal}</td>
                        </tr>`);
        }

        this.balanceHistory = {
            balance: list,
            recordedTime: time,
        };
        this.saveBalance(this.balanceHistory);
        html.push('</tbody></table>');
        html = html.join('');

        return { subject, html };

    }
    /**
     * @description 将财务信息保存到磁盘
     *
     * @param {object} data
     * @memberof AccountService
     */
    saveBalance(data) {
        const STR = JSON.stringify(data);
        fs.writeFile(savePath, STR, (err) => {
            if (err) throw err;
            console.log(`The ${savePath} has been saved!`);
        });

        fs.writeFile(`./static/exchange/${this.type}/balance/${moment().format('YYYY-MM-DD HH')}.json`, STR, (err) => {
            if (err) throw err;
            console.log('The dateFile has been saved!');
        });
    }


};

//导出一个对象
export default  AccountService;