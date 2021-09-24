/**
 * 项目动态
 * Created by wrb on 2020/7/29.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_party_build",
        defaults = {
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._dataList = [];
        this._projectTypeList = [];//项目类型列表
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that._filterData = {
                pageIndex : 0,
                pageSize : 10
            };
            var dataAction = that.settings.dataAction;
            if(isNullOrBlank(dataAction))
                dataAction = $(that.element).find('ul.secondary-menu-ul li:first').attr('id');

            that.switchPage(dataAction);
            var html = template('m_partyBuild/m_party_build', {});
            $(that.element).html(html);
            $(that.element).find('#timeSelect').m_filter_time_new({label:'日&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;期'},true);
            that.renderContent(1)
        }
        //切换页面
        , switchPage: function (dataAction) {
            var that = this;
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
        }
        /**
         *
         * @param t=1,第一次渲染
         * @param callBack
         */
        ,renderContent:function (t,callBack) {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listPartyBuild;
            option.postData = filterParam(that._filterData);
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    if(response.data.data && response.data.data.length>0){
                        that._dataList = response.data.data;
                        $(that.element).find('.no-data').hide();

                        var html = template('m_partyBuild/m_party_build_item',{dataList:response.data.data});
                        $(that.element).find('.project-notice').append(html);

                        var pageTotal = (that._filterData.pageIndex+1)*that._filterData.pageSize;
                        if(pageTotal>=response.data.total){
                            $(that.element).find('button[data-action="btnPageNext"]').hide();
                        }else{
                            $(that.element).find('button[data-action="btnPageNext"]').show();
                        }
                        that._filterData.pageIndex++;
                        that.editHoverFun();
                        that.bindFileClick();
                    }else if(t==1){
                        $(that.element).find('.no-data').show();
                    }
                    $(that.element).find('#totalBySearch').html(response.data.total);

                    that.bindActionClick();
                    that.renderFilterResult();
                    rolesControl();
                    if(callBack)
                        callBack(response.data.data);

                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //hover事件
        ,editHoverFun:function ($ele) {

            var that = this;
            $(that.element).find('.vertical-timeline-block').off('mouseenter').unbind('mouseleave').hover(function () {

                $(this).find('a').show();

            },function () {
                $(this).find('a').hide();
            });

        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action],a[data-action]').off('click').on('click',function () {

                var $this = $(this),dataAction=$this.attr('data-action');
                var dataId = $this.attr('data-id');
                switch (dataAction){
                    case 'btnPageNext':
                        that.renderContent(0,function (data) {
                            if(data==null || data.length==0){
                                $this.parent().html('<p class="fc-v1-grey">没有更多数据了</p>');
                            }
                        });
                        break;
                    case 'search':
                        that._filterData = {
                            pageIndex : 0,
                            pageSize : 10
                        };
                        $(that.element).find('#vertical-timeline .project-notice').html('');
                        that.renderFilterResult();
                        that.renderContent(1);
                        break;
                    case 'refreshBtn':
                        that.init();
                        break;
                    case 'addDynamicsNotice'://添加动态
                        $('body').m_party_build_edit({
                            projectId: that.settings.projectId,
                            saveCallBack: function () {
                                that.init();
                            }
                        },true);
                        break;
                    case 'editDynamicsNotice'://编辑动态
                        var dataItem = getObjectInArray(that._dataList,dataId);
                        $('body').m_party_build_edit({
                            id:dataId,
                            dataItem:dataItem,
                            saveCallBack:function (data) {
                                that.init();
                            }
                        },true);
                        break;
                    case 'delDynamicsNotice'://删除动态
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                            var option = {};
                            option.url = restApi.url_deletePartyBuild;
                            option.postData = {
                                id:dataId
                            };
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.init();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;
                }
                return false;

            });


        }
        ,bindFileClick:function () {
            var that = this;
            $.each($(that.element).find('div[data-action="fileAction"]'), function (i, o) {
                $(o).off('click.fileAction').on('click.fileAction', function () {
                    window.open($(this).attr('data-src'));
                })
            });
        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];
            //时间
            var timeData = $(that.element).find('#timeSelect').m_filter_time_new('getTimeData');
            that._filterData.startTime = timeData.startTime;
            that._filterData.endTime = timeData.endTime;

            if(!isNullOrBlank(timeData.days)){
                resultList.push({
                    name:timeData.days,
                    type:3
                });
            }else if(!isNullOrBlank(that._filterData.startTime) || !isNullOrBlank(that._filterData.endTime)){
                resultList.push({
                    name:momentFormat(that._filterData.startTime,'YYYY/MM/DD')+'~'+momentFormat(that._filterData.endTime,'YYYY/MM/DD'),
                    type:3
                });
            }
            //项目搜索
            that._filterData.content = $.trim($(that.element).find('input[name="keyword"]').val());
            if(!isNullOrBlank(that._filterData.content)){
                resultList.push({
                    name:that._filterData.content,
                    type:4
                });
            }
            $(that.element).find('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $(that.element).find('.filter-result-col').append(html);

            $(that.element).find('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                    if(type==3){//时间

                    $(that.element).find('#timeSelect').m_filter_time_new('clearTime');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==4){//项目搜索

                    $(that.element).find('input[name="keyword"]').val('');
                    $(that.element).find('button[data-action="search"]').click();

                }

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
