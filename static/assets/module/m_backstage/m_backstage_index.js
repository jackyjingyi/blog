/**
 * 后台管理-主页
 * Created by wrb on 2018/11/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_backstage_index",
        defaults = {};

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyId = window.currentCompanyId;
        this._companyVersion = window.companyVersion;
        this._userInfo = window.userInfo;
        this._companyInfo = window.companyInfo;
        this._dataInfo = null;
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        , render: function () {
            var that = this;

            that.getBaseData(function () {

                that._dataInfo.companyVersion = that._companyVersion;
                that._dataInfo.companyName = that._companyInfo.companyName;
                that._dataInfo.userName = that._userInfo.userName;
                var html = template('m_backstage/m_backstage_index', that._dataInfo);
                $(that.element).html(html);
                that.renderChart(that._dataInfo.useCount,that._dataInfo.usableCount,'chartArea1');
                that.renderChart(that._dataInfo.useSize,that._dataInfo.freeSize,'chartArea2');
                that.renderOrderList();

            });
        }
        //请求chart数据
        ,getBaseData:function (callBack) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_consoleHome;
            m_ajax.post(option, function (response) {
                if (response.code == '0') {
                    that._dataInfo = response.data;
                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,renderChart:function (useCount,usableCount,id) {
            var that = this;
            var option = {
                tooltip: {
                    trigger: 'item',
                    formatter: "{a} <br/>{b}: {c} ({d}%)"
                },
                grid: {
                    left: '1%',
                    right: '1%',
                    bottom: '1%',
                    containLabel: true
                },
                /*legend: {
                    orient: 'vertical',
                    x: 'left',
                    data:['已用','未用']
                },*/
                series: [
                    {
                        name:'使用情况',
                        type:'pie',
                        radius: ['70%', '90%'],
                        avoidLabelOverlap: false,
                        label: {
                            normal: {
                                show: false,
                                position: 'center'
                            }
                        },
                        labelLine: {
                            normal: {
                                show: true
                            }
                        },
                        data:[
                            {value:useCount, name:'已用'},
                            {value:usableCount, name:'未用'}
                        ]
                    }
                ],
                color: ['#00bebc','#e0e0e0']
            };
            var chart = echarts.init(document.getElementById(id));
            chart.setOption(option);
            //window.onresize = chart.resize;
            window.addEventListener('resize', function () {
                chart.resize();
            });
        }
        //渲染购买记录list
        , renderOrderList:function () {
            var that = this;
            var option = {};
            option.param = {};
            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_queryOrderHistory,
                pageSize:5,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    var html = template('m_backstage/m_backstage_order_list',{
                        dataList:response.data.data
                    });
                    $(that.element).find('.data-list-container').html(html);
                    that.bindActionClick();
                    rolesControl();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //支付订单
        ,payOrder:function ($this) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_payOrder;
            option.postData = {
                id:$this.closest('tr').attr('data-id')
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    that.renderOrderList();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //删除订单
        ,delOrder:function (id) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_deleteOrder+'/'+id;
            m_ajax.get(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    that.init();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var dataValue = $this.attr('data-value');
                switch (dataAction){
                    case 'payOrder'://支付

                        if(dataValue=='1')
                            return false;

                        S_layer.confirm('确定支付？',function(){
                            that.payOrder($this);
                            window.location.reload();
                        },function(){
                            //S_layer.close($(event));
                        });
                        return false;
                        break;
                    case 'delOrder'://删除

                        S_layer.confirm('确定删除订单？',function(){
                            that.delOrder($this.closest('tr').attr('data-id'));
                        },function(){
                            //S_layer.close($(event));
                        });
                        return false;
                        break;
                    case 'applyBilling'://申请开票

                        $('body').m_backstage_apply_billing({
                            status:$this.attr('data-status'),
                            orderId:$this.closest('tr').attr('data-id'),
                            invoiceId:$this.attr('data-invoice-id'),
                            title:$.trim($this.text()),
                            saveCallBack:function () {
                                that.renderOrderList();
                            }
                        },true);
                        return false;
                        break;
                    case 'viewAccountChart'://账号统计

                        $('body').m_backstage_index_chart({doType:1},true);
                        break;

                    case 'viewSpaceChart'://空间统计
                        $('body').m_backstage_index_chart({doType:2},true);
                        break;
                }
            });
            $(that.element).find('.data-list-container table tr[data-id]').off('click').on('click',function () {
                location.hash = '#/backstageMgt/purchase/details?id='+$(this).closest('tr').attr('data-id');
            });
        }
    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);