/**
 * 公司收支排行
 * Created by wrb on 2020/6/12.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_stats_theater_ranking",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this._projectList = [];//项目列表
        this._filterData = {};//筛选条件
        this._dataList = [];//列表
        this._projectId = null;//项目ID
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_stats/m_stats_theater_ranking',{});
            $(that.element).html(html);

            //$(that.element).find('#timeSelect').m_filter_time_new({label:'立项时间'},true);
            $(that.element).find('input[name="year"]').val(new Date().getFullYear());
            that.renderDataList();

        }
        //渲染list
        ,renderDataList:function (t) {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listZoneProjectStatic;
            option.postData = {};
            option.postData.year = $(that.element).find('input[name="year"]').val();
            option.postData = $.extend({}, option.postData, that._filterData);
            option.postData = filterParam(option.postData);
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){


                    var html = template('m_stats/m_stats_theater_ranking_list',{
                        dataList:response.data
                    });
                    $(that.element).find('.data-list-container').html(html);
                    $(that.element).find('#totalBySearch').html(response.data.length);
                    that.renderFilterResult();
                    that.bindBtnActionClick();
                    that.sortActionClick();
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
                    case 'exportDetails'://导出
                        var data = $.extend(true, {}, that._filterData);
                        data.year = $(that.element).find('input[name="year"]').val();
                        //data.combineCompanyId = data.selectOrgId;
                        downLoadFile({
                            url:restApi.url_exportServeCompany,
                            data:filterParam(data),
                            type:1
                        });
                        return false;
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
        //排序
        ,sortActionClick:function () {
            var that = this;
            $(that.element).find('th[data-action="sort"]').each(function () {
                var $this = $(this),code = $this.attr('data-code');
                code = code+'Order';
                var sortField = that._filterData[code];
                var sortClass = '';
                if(sortField=='0'){
                    sortClass = 'sorting_asc';
                }else if(sortField=='1'){
                    sortClass = 'sorting_desc';
                }else{
                    sortClass = 'sorting';
                }
                $this.removeClass('sorting_asc sorting_desc sorting').addClass(sortClass);
                $this.off('click').on('click',function (e) {

                    $(that.element).find('th[data-action="sort"]').each(function () {
                        var iCode =  $(this).attr('data-code') + 'Order';
                        if(code!=iCode){
                            that._filterData[iCode] = null;
                            $(this).removeClass().addClass('sorting');
                        }
                    });
                    if($this.hasClass('sorting')||$this.hasClass('sorting_asc')){
                        that._filterData[code] = '1';
                        sortClass = 'sorting_desc';
                    }
                    else if($this.hasClass('sorting_desc')){
                        that._filterData[code] = '0';
                        sortClass = 'sorting_asc';
                    }else{
                        sortClass = 'sorting';
                    }

                    $this.removeClass().addClass(sortClass);

                    that.renderDataList();

                    e.stopPropagation();
                    return false;
                });
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
