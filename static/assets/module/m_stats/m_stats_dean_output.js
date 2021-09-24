/**
 * 院长产值统计
 * Created by wrb on 2020/6/12.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_stats_dean_output",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._dataList = [];//列表
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_stats/m_stats_dean_output',{});
            $(that.element).html(html);

            $(that.element).find('input[name="year"]').val(new Date().getFullYear());
            that.renderDataList();

        }
        //渲染list
        ,renderDataList:function (t) {
            var that = this;

            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listProjectDeanOutputStatic;
            option.postData = {};
            option.postData.year = $(that.element).find('input[name="year"]').val();
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    that._dataList = response.data;
                    var html = template('m_stats/m_stats_dean_output_list',{
                        dataList:response.data
                    });
                    $(that.element).find('.data-list-container').html(html);
                    $(that.element).find('#totalBySearch').html(response.data.length);
                    that.renderFilterResult();
                    that.bindBtnActionClick();

                }else {
                    S_layer.error(response.info);
                }
            })


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
            $(that.element).find('tr[data-id]').off('click').on('click',function () {
                var $this = $(this);
                var dataId = $this.attr('data-id');
                var dataItem = getObjectInArray(that._dataList,dataId);
                $('body').m_stats_user_output_details({dataInfo:dataItem,doType:2});
            })
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
