/**
 * 院长产值统计
 * Created by wrb on 2020/6/12.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_stats_dean_bill",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._year = null;
        this._dataList = [];//列表
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_stats/m_stats_dean_bill',{});
            $(that.element).html(html);
            $(that.element).find('input[name="year"]').val(new Date().getFullYear());
            that.renderDataList();

        }
        //渲染list
        ,renderDataList:function (t) {
            var that = this;

            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listDeanBillStatistic;
            option.postData = {};
            option.postData.year = $(that.element).find('input[name="year"]').val();
            that._year = $(that.element).find('input[name="year"]').val();
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    that._dataList = response.data;
                    var html = template('m_stats/m_stats_dean_bill_list',{
                        dataList:response.data,
                        year:that._year
                    });
                    $(that.element).find('.data-list-container').html(html);
                    $(that.element).find('#totalBySearch').html(response.data.length);
                    that.renderFilterResult();
                    that.bindBtnActionClick();
                    that.initEditCostPoint();
                    rolesControl();//权限控制初始化
                }else {
                    S_layer.error(response.info);
                }
            })
        }




        //初始化编辑x-editable{dataEditType:1=节点描述，2＝比例，3＝金额，4＝明细金额,6=明细付款金额}
        ,initEditCostPoint:function () {
            var that = this;

            $(that.element).find('a[data-action="editFee"]').off('click').on('click',function () {
                var $this = $(this);
                var dataType = $(this).attr('data-type');
                var companyUserId = $this.attr('data-user-id');

                var deanBill = getObjectInArray(that._dataList,companyUserId,"companyUserId");
                var $data = {};
                $data.type=dataType;
                $data.year=that._year;
                $data.companyUserId=companyUserId;
                $data.userName=deanBill.userName;

                if(dataType =="1"){
                    $data.dataList=deanBill.contractList;
                    $data.fee=deanBill.contractFee;
                }else{
                    $data.dataList=deanBill.receiveList;
                    $data.fee=deanBill.backFee;
                }
                $data.saveCallBack = function () {
                    that.renderDataList();
                }
                $('body').m_stats_dean_bill_detail($data,true);
            });
        }
        //按钮事件绑定
        ,bindBtnActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'search':
                        that.renderFilterResult();
                        that.renderDataList();
                        break;
                    case 'refreshBtn':
                        that.init();
                        break;

                }
                return false;
            });
        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];
            //所属年度
            resultList.push({
                name:$(that.element).find('input[name="year"]').val()+'年',
                type:1
            });

            $(that.element).find('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $(that.element).find('.filter-result-col').append(html);

            $(that.element).find('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//所属年度

                    $(that.element).find('input[name="year"]').val(new Date().getFullYear());
                    $(that.element).find('button[data-action="search"]').click();

                }

            });
        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
